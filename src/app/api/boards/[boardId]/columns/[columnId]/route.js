// src/app/api/boards/[boardId]/columns/[columnId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { boardId: string, columnId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { boardId, columnId } = params;

    // Verify board exists and user has permission
    const board = await db.board.findUnique({
      where: {
        id: boardId,
        // Ensure user has access to the board
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        columns: {
          include: {
            cards: true,
          },
        },
      },
    });

    if (!board) {
      return new NextResponse("Board not found or access denied", {
        status: 404,
      });
    }

    // Delete column and its cards
    await db.column.delete({
      where: {
        id: columnId,
        boardId,
      },
    });

    // Get updated board with remaining columns
    const updatedBoard = await db.board.findUnique({
      where: {
        id: boardId,
      },
      include: {
        members: true,
        columns: {
          orderBy: {
            order: "asc",
          },
          include: {
            cards: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("[COLUMN_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
