// src/app/board/[boardId]/page.tsx
"use client";

import { Box, Container, useToast, Flex, Button } from "@chakra-ui/react";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardMembers } from "@/components/board/BoardMembers";
import Column from "@/components/board/Column";
import AddColumnModal from "@/components/board/AddColumnModal";
import AddCardModal from "@/components/board/AddCardModal";
import { useQuery } from "@apollo/client";
import { GET_BOARD } from "@/graphql/board";
import { useAuth } from "@/contexts/auth-context";
import { useBoard } from "@/contexts/board-context";
import { useUI } from "@/contexts/ui-context";
import { LoadingState } from "@/components/ui/LoadingState";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { handleError } from "@/utils/error-handling";
import { CardInput } from "@/types/board";
import AddMemberModal from "@/components/board/AddMemberModal";

interface BoardPageProps {
  params: {
    boardId: string;
  };
}

function BoardContent({ boardId }: { boardId: string }) {
  const toast = useToast();
  const {
    currentBoard,
    setCurrentBoard,
    moveCard,
    moveColumn,
    addColumn,
    addCard,
    updateBoard,
    inviteMember,
    removeMember,
  } = useBoard();

  const { modals, openModal, closeModal, activeColumnId, setActiveColumnId } =
    useUI();

  const { loading, error } = useQuery(GET_BOARD, {
    variables: { id: boardId },
    onCompleted: (data) => setCurrentBoard(data.board),
    onError: (error) => handleError(error, toast),
  });

  if (loading) return <LoadingState />;
  if (error) return null;
  if (!currentBoard) return null;

  const handleTitleChange = async (newTitle: string) => {
    try {
      await updateBoard(currentBoard.id, { title: newTitle });
      toast({
        title: "Board updated",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  const handleToggleStar = async () => {
    try {
      await updateBoard(currentBoard.id, {
        isStarred: !currentBoard.isStarred,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  const handleInviteMember = async (email: string) => {
    try {
      await inviteMember(currentBoard.id, email);
      toast({
        title: "Invitation sent",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(currentBoard.id, memberId);
      toast({
        title: "Member removed",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;

    try {
      if (type === "COLUMN") {
        await moveColumn(source.index, destination.index);
      } else {
        await moveCard(
          {
            id: result.draggableId,
            columnId: source.droppableId,
            index: source.index,
          },
          {
            id: result.draggableId,
            columnId: destination.droppableId,
            index: destination.index,
          }
        );
      }
    } catch (error) {
      handleError(error, toast);
    }
  };

  const handleAddColumn = async (title: string) => {
    try {
      await addColumn(title);
      closeModal("addColumn");
      toast({
        title: "Column added",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  const handleAddCard = async (cardData: CardInput) => {
    if (!activeColumnId) return;

    try {
      await addCard(activeColumnId, cardData);
      closeModal("addCard");
      toast({
        title: "Card added",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  return (
    <Box minH="100vh" bg={currentBoard.background || "gray.100"}>
      <BoardHeader
        title={currentBoard.title}
        members={currentBoard.members.length}
        isStarred={currentBoard.isStarred}
        onTitleChange={handleTitleChange}
        onToggleStar={handleToggleStar}
        onInviteMember={() => openModal("addMember")}
      />

      <Container maxW="container.xl" py={6}>
        <Box mb={6}>
          <BoardMembers
            members={currentBoard.members}
            onInviteMember={handleInviteMember}
            onRemoveMember={handleRemoveMember}
          />
        </Box>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="COLUMN">
            {(provided) => (
              <Flex
                ref={provided.innerRef}
                {...provided.droppableProps}
                gap={4}
                overflowX="auto"
                pb={4}
              >
                {currentBoard.columns?.map((column, index) => (
                  <Column
                    key={column.id}
                    column={column} // Changed from 'data' to 'column'
                    index={index}
                    onAddCard={() => {
                      setActiveColumnId(column.id);
                      openModal("addCard");
                    }}
                    boardId={currentBoard.id} // Add this if your Column component requires it
                  />
                ))}
                {provided.placeholder}

                <Button
                  minW="280px"
                  h="40px"
                  onClick={() => openModal("addColumn")}
                  colorScheme="gray"
                  variant="ghost"
                  _hover={{ bg: "gray.100" }}
                >
                  Add List
                </Button>
              </Flex>
            )}
          </Droppable>
        </DragDropContext>

        <AddColumnModal
          isOpen={modals.addColumn}
          onClose={() => closeModal("addColumn")}
          onSubmit={handleAddColumn}
        />

        <AddCardModal
          isOpen={modals.addCard}
          onClose={() => closeModal("addCard")}
          onSubmit={handleAddCard}
        />

        <AddMemberModal
          isOpen={modals.addMember}
          onClose={() => closeModal("addMember")}
          onInvite={handleInviteMember}
        />
      </Container>
    </Box>
  );
}

export default function BoardPage({ params }: BoardPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    router.push("/login");
    return null;
  }

  return <BoardContent boardId={params.boardId} />;
}
