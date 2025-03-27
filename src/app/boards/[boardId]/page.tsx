// src/app/boards/[boardId]/page.tsx
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

import { fetchBoard, updateBoard } from "@/services/boardService";
import { Board } from "@/types/board";
import Column from "@/components/board/Column";
import AddColumnModal from "@/components/board/AddColumnModal";
import { handleError } from "@/utils/error-handling";

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const headerBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (boardId) {
      loadBoard(boardId as string);
    }
  }, [boardId]);

  const loadBoard = async (id: string) => {
    setIsLoading(true);
    try {
      const boardData = await fetchBoard(id);
      setBoard(boardData);
    } catch (err) {
      console.error("Failed to load board:", err);
      setError("Failed to load board details. Please try again.");
      handleError(err, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
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

      // Update column orders
      newColumns.forEach((column, index) => {
        column.order = index;
      });

      newBoard.columns = newColumns;
      setBoard(newBoard);

      try {
        await updateBoard(board.id, { columns: newColumns });
      } catch (error) {
        handleError(error, toast);
        loadBoard(board.id); // Reload board to reset to server state
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

      // Update card orders
      newCards.forEach((card, index) => {
        card.order = index;
      });

      sourceColumn.cards = newCards;
    }
    // Moving from one column to another
    else {
      const sourceCards = Array.from(sourceColumn.cards);
      const [movedCard] = sourceCards.splice(source.index, 1);
      const destCards = Array.from(destColumn.cards);

      // Update the card's column ID
      movedCard.columnId = destColumn.id;

      destCards.splice(destination.index, 0, movedCard);

      // Update card orders in both columns
      sourceCards.forEach((card, index) => {
        card.order = index;
      });

      destCards.forEach((card, index) => {
        card.order = index;
      });

      sourceColumn.cards = sourceCards;
      destColumn.cards = destCards;
    }

    setBoard(newBoard);

    try {
      await updateBoard(board.id, { columns: newBoard.columns });
    } catch (error) {
      handleError(error, toast);
      loadBoard(board.id); // Reload board to reset to server state
    }
  };

  const handleAddColumn = async (title: string) => {
    if (!board) return;

    try {
      // Replace with your actual API call to add a column
      const updatedBoard = await updateBoard(board.id, {
        columns: [
          ...board.columns,
          {
            id: `temp-id-${Date.now()}`, // This will be replaced by the server
            title,
            order: board.columns.length,
            cards: [],
          },
        ],
      });

      setBoard(updatedBoard);
      toast({
        title: "List added",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  const toggleBoardStar = async () => {
    if (!board) return;

    try {
      const updatedBoard = await updateBoard(board.id, {
        isStarred: !board.isStarred,
      });
      setBoard(updatedBoard);
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

  if (error || !board) {
    return (
      <Flex direction="column" align="center" justify="center" height="80vh">
        <Text mb={4}>{error || "Board not found"}</Text>
        <Button onClick={() => boardId && loadBoard(boardId as string)}>
          Try Again
        </Button>
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
                {(Array.isArray(board.columns) ? board.columns : [])
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
