// src/app/board/[boardId]/page.tsx
"use client";

import { Box, Container, useToast, Flex, Button } from "@chakra-ui/react";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardMembers } from "@/components/board/BoardMembers";
import Column from "@/components/board/Column";
import AddColumnModal from "@/components/board/AddColumnModal";
import AddCardModal from "@/components/board/AddCardModal";
import { useQuery, useMutation } from "@apollo/client";
import { ApolloError } from "@apollo/client";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import {
  GET_BOARD,
  UPDATE_BOARD,
  INVITE_MEMBER,
  REMOVE_MEMBER,
} from "@/graphql/board";
import { useAuth } from "@/contexts/auth-context";
import { useBoard } from "@/contexts/board-context";
import { useUI } from "@/contexts/ui-context";
import { LoadingState } from "@/components/ui/LoadingState";
import { useRouter } from "next/navigation";

interface BoardPageProps {
  params: {
    boardId: string;
  };
}

export default function BoardPage({ params }: BoardPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  // Context hooks
  const {
    currentBoard,
    setCurrentBoard,
    moveCard,
    moveColumn,
    addColumn,
    addCard,
  } = useBoard();

  const { modals, openModal, closeModal, activeColumnId, setActiveColumnId } =
    useUI();

  // Query for board data
  const { data, loading, error } = useQuery(GET_BOARD, {
    variables: { id: params.boardId },
    onCompleted: (data) => {
      setCurrentBoard(data.board);
    },
  });

  // Mutations
  const [updateBoard] = useMutation(UPDATE_BOARD);
  const [inviteMember] = useMutation(INVITE_MEMBER);
  const [removeMember] = useMutation(REMOVE_MEMBER);

  if (!user) {
    router.push("/login");
    return null;
  }

  if (loading) return <LoadingState />;

  if (error) {
    toast({
      title: "Error loading board",
      description:
        error instanceof ApolloError
          ? error.message
          : "An unknown error occurred",
      status: "error",
      duration: 5000,
    });
    return null;
  }

  if (!currentBoard) {
    router.push("/dashboard");
    return null;
  }

  const handleTitleChange = async (newTitle: string) => {
    try {
      await updateBoard({
        variables: {
          id: currentBoard.id,
          input: { title: newTitle },
        },
      });
      setCurrentBoard({ ...currentBoard, title: newTitle });
    } catch (err) {
      const error = err as ApolloError;
      toast({
        title: "Error updating board title",
        description: error.message || "An unknown error occurred",
        status: "error",
      });
    }
  };

  const handleToggleStar = async () => {
    try {
      await updateBoard({
        variables: {
          id: currentBoard.id,
          input: { isStarred: !currentBoard.isStarred },
        },
      });
      setCurrentBoard({ ...currentBoard, isStarred: !currentBoard.isStarred });
    } catch (err) {
      const error = err as ApolloError;
      toast({
        title: "Error updating board",
        description: error.message || "An unknown error occurred",
        status: "error",
      });
    }
  };

  const handleInviteMember = async (email: string) => {
    try {
      const result = await inviteMember({
        variables: {
          boardId: currentBoard.id,
          email,
        },
      });
      setCurrentBoard({
        ...currentBoard,
        members: result.data.inviteMember.members,
      });
      toast({
        title: "Invitation sent",
        status: "success",
      });
    } catch (err) {
      const error = err as ApolloError;
      toast({
        title: "Error inviting member",
        description: error.message || "An unknown error occurred",
        status: "error",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const result = await removeMember({
        variables: {
          boardId: currentBoard.id,
          memberId,
        },
      });
      setCurrentBoard({
        ...currentBoard,
        members: result.data.removeMember.members,
      });
      toast({
        title: "Member removed",
        status: "success",
      });
    } catch (err) {
      const error = err as ApolloError;
      toast({
        title: "Error removing member",
        description: error.message || "An unknown error occurred",
        status: "error",
      });
    }
  };

  const handleDragEnd = (result: any) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === "COLUMN") {
      moveColumn(source.index, destination.index);
    } else {
      moveCard(
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
                    data={column}
                    index={index}
                    onAddCard={() => {
                      setActiveColumnId(column.id);
                      openModal("addCard");
                    }}
                  />
                ))}
                {provided.placeholder}

                <Button
                  minW="280px"
                  h="40px"
                  onClick={() => openModal("addColumn")}
                >
                  Add List
                </Button>
              </Flex>
            )}
          </Droppable>
        </DragDropContext>

        {/* Modals */}
        <AddColumnModal
          isOpen={modals.addColumn}
          onClose={() => closeModal("addColumn")}
          onSubmit={async (title) => {
            await addColumn(title);
            closeModal("addColumn");
          }}
        />

        <AddCardModal
          isOpen={modals.addCard}
          onClose={() => closeModal("addCard")}
          onSubmit={async (cardData) => {
            if (activeColumnId) {
              await addCard(activeColumnId, cardData);
              closeModal("addCard");
            }
          }}
        />
      </Container>
    </Box>
  );
}
