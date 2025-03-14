// src/app/dashboard/page.tsx
"use client";

import { Container, useToast } from "@chakra-ui/react";
import { BoardList } from "@/components/board/BoardList";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USER_BOARDS, CREATE_BOARD } from "@/graphql/board";
import { useAuth } from "@/contexts/auth-context";
import { useBoard } from "@/contexts/board-context";
import { LoadingState } from "@/components/ui/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Board } from "@/types/board";
import { ApolloError } from "@apollo/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { handleError } from "@/utils/error-handling";

interface CreateBoardInput {
  title: string;
  description?: string;
}

function DashboardContent() {
  const router = useRouter();
  const toast = useToast();
  const { setCurrentBoard } = useBoard();
  const { user } = useAuth();

  const { data, loading } = useQuery(GET_USER_BOARDS, {
    skip: !user,
    onError: (error: ApolloError) => {
      toast({
        title: "Error loading boards",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    },
  });

  const [createBoard, { loading: isCreating }] = useMutation(CREATE_BOARD, {
    onError: (error: ApolloError) => {
      toast({
        title: "Error creating board",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    },
  });

  if (loading) return <LoadingState />;

  const handleBoardClick = (board: Board) => {
    setCurrentBoard(board);
    router.push(`/board/${board.id}`);
  };

  const handleCreateBoard = async (boardData: CreateBoardInput) => {
    try {
      const { data: createData } = await createBoard({
        variables: {
          input: boardData,
        },
        refetchQueries: [{ query: GET_USER_BOARDS }],
      });

      const newBoard = createData.createBoard;
      setCurrentBoard(newBoard);
      router.push(`/board/${newBoard.id}`);

      toast({
        title: "Board created",
        description: "Successfully created new board",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
      <BoardList
        boards={data?.boards || []}
        onBoardClick={handleBoardClick}
        onCreateBoard={handleCreateBoard}
        isCreating={isCreating}
      />
    </Container>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
