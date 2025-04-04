"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Spinner,
  Text,
  useToast,
  IconButton,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiPlus, FiStar, FiSettings } from "react-icons/fi";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_BOARD,
  UPDATE_BOARD,
  ADD_COLUMN,
  MOVE_CARD,
  MOVE_COLUMN,
} from "@/graphql/board";
import { Board } from "@/types/board";
import Column from "@/components/board/Column";
import AddColumnModal from "@/components/board/AddColumnModal";

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState<Board | null>(null);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const headerBg = useColorModeValue("white", "gray.800");

  // GraphQL queries and mutations
  const {
    loading: isLoading,
    error: queryError,
    data,
    refetch,
  } = useQuery(GET_BOARD, {
    variables: { id: boardId as string },
    skip: !boardId,
    fetchPolicy: "network-only", // Don't use cache for this query
  });

  const [updateBoardMutation] = useMutation(UPDATE_BOARD);
  const [addColumnMutation] = useMutation(ADD_COLUMN);
  const [moveCardMutation] = useMutation(MOVE_CARD);
  const [moveColumnMutation] = useMutation(MOVE_COLUMN);

  useEffect(() => {
    if (data?.board) {
      setBoard(data.board);
    }
  }, [data]);

  const handleError = (error: any, toast: any) => {
    console.error(error);
    toast({
      title: "Error",
      description: error.message || "Something went wrong",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, type } = result;

    // Dropped outside the list or no change
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    if (!board) return;

    // Create a copy of the board to work with
    const newBoard = { ...board };

    // Handle column dragging
    if (type === "COLUMN") {
      const newColumns = Array.from(newBoard.columns);
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);

      // Update column orders immutably
      const updatedColumns = newColumns.map((column, index) => ({
        ...column,
        order: index,
      }));

      newBoard.columns = updatedColumns;
      setBoard(newBoard);

      try {
        const { data } = await moveColumnMutation({
          variables: {
            boardId: board.id,
            sourceIndex: source.index,
            destinationIndex: destination.index,
          },
        });

        if (data?.moveColumn) {
          setBoard(data.moveColumn);
        }
      } catch (error) {
        handleError(error, toast);
        refetch(); // Reload board to reset to server state
      }
      return;
    }

    // Handle card dragging
    const sourceColumn = newBoard.columns.find(
      (col) => col.id === source.droppableId
    );
    const destColumn = newBoard.columns.find(
      (col) => col.id === destination.droppableId
    );

    if (!sourceColumn || !destColumn) return;

    // Moving within the same column
    if (sourceColumn === destColumn) {
      const newCards = Array.from(sourceColumn.cards);
      const [movedCard] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, movedCard);

      // Update card orders immutably
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        order: index,
      }));

      sourceColumn.cards = updatedCards;
    }
    // Moving from one column to another
    else {
      const sourceCards = Array.from(sourceColumn.cards);
      const [movedCard] = sourceCards.splice(source.index, 1);
      const destCards = Array.from(destColumn.cards);

      // Create a new card with ALL properties preserved plus the updated columnId
      const updatedMovedCard = {
        ...movedCard, // This preserves ALL card properties (title, description, etc.)
        columnId: destColumn.id,
      };

      destCards.splice(destination.index, 0, updatedMovedCard);

      // When updating order, make sure to preserve ALL card properties
      const updatedSourceCards = sourceCards.map((card, index) => ({
        ...card, // Keep all existing properties
        order: index,
      }));

      const updatedDestCards = destCards.map((card, index) => ({
        ...card, // Keep all existing properties
        order: index,
      }));

      sourceColumn.cards = updatedSourceCards;
      destColumn.cards = updatedDestCards;
    }

    setBoard(newBoard);

    try {
      const { data } = await moveCardMutation({
        variables: {
          boardId: board.id,
          source: {
            columnId: source.droppableId, // CHANGED FROM droppableId TO columnId
            index: source.index,
          },
          destination: {
            columnId: destination.droppableId, // CHANGED FROM droppableId TO columnId
            index: destination.index,
          },
        },
      });

      if (data?.moveCard) {
        setBoard(data.moveCard);
      }
    } catch (error) {
      handleError(error, toast);
      refetch(); // Reload board to reset to server state
    }
  };

  const handleAddColumn = async (title: string) => {
    if (!board || !title.trim()) return;

    try {
      const { data } = await addColumnMutation({
        variables: {
          boardId: board.id,
          title: title.trim(),
        },
      });

      if (data?.addColumn) {
        setBoard(data.addColumn);
        toast({
          title: "List added",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      handleError(error, toast);
    }
  };

  const toggleBoardStar = async () => {
    if (!board) return;

    try {
      const { data } = await updateBoardMutation({
        variables: {
          id: board.id,
          input: {
            isStarred: !board.isStarred,
          },
        },
      });

      if (data?.updateBoard) {
        setBoard({
          ...board,
          isStarred: data.updateBoard.isStarred,
        });
      }
    } catch (error) {
      handleError(error, toast);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (queryError || !board) {
    return (
      <Flex direction="column" align="center" justify="center" height="80vh">
        <Text mb={4}>{queryError?.message || "Board not found"}</Text>
        <Button onClick={() => refetch()}>Try Again</Button>
      </Flex>
    );
  }

  return (
    <Box height="100vh" bg={bgColor} display="flex" flexDirection="column">
      {/* Board Header */}
      <Flex
        py={3}
        px={6}
        bg={headerBg}
        borderBottomWidth="1px"
        align="center"
        justify="space-between"
      >
        <Flex align="center">
          <Heading size="lg" mr={3}>
            {board.title}
          </Heading>
          <IconButton
            aria-label={board.isStarred ? "Unstar board" : "Star board"}
            icon={<FiStar fill={board.isStarred ? "currentColor" : "none"} />}
            variant="ghost"
            colorScheme={board.isStarred ? "yellow" : "gray"}
            onClick={toggleBoardStar}
          />
        </Flex>
        <IconButton
          aria-label="Board settings"
          icon={<FiSettings />}
          variant="ghost"
        />
      </Flex>

      {/* Board Content */}
      <Box
        flex="1"
        p={4}
        overflowX="auto"
        css={{
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,0,0,0.1)",
            borderRadius: "24px",
          },
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable
            droppableId="all-columns"
            direction="horizontal"
            type="COLUMN"
          >
            {(provided) => (
              <Flex
                ref={provided.innerRef}
                {...provided.droppableProps}
                alignItems="flex-start"
                minHeight="calc(100% - 32px)"
              >
                {(Array.isArray(board.columns) ? [...board.columns] : [])
                  .sort((a, b) => a.order - b.order)
                  .map((column, index) => (
                    <Column
                      key={column.id}
                      column={column}
                      index={index}
                      boardId={board.id}
                      onBoardChange={(updatedBoard) => setBoard(updatedBoard)}
                    />
                  ))}
                {provided.placeholder}

                <Button
                  leftIcon={<FiPlus />}
                  onClick={() => setIsAddColumnModalOpen(true)}
                  colorScheme="gray"
                  variant="outline"
                  h="40px"
                  minW="280px"
                  ml={2}
                >
                  Add List
                </Button>
              </Flex>
            )}
          </Droppable>
        </DragDropContext>
      </Box>

      {/* Add Column Modal */}
      <AddColumnModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        onSubmit={handleAddColumn}
      />
    </Box>
  );
}
