// src/components/board/Column.tsx
import { useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  IconButton,
  Input,
  Flex,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiPlus, FiMoreHorizontal, FiEdit2, FiTrash2 } from "react-icons/fi";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Board, Column as ColumnType } from "@/types/board";
import Card from "./Card";
import { useMutation } from "@apollo/client";
import {
  ADD_CARD,
  UPDATE_COLUMN_MUTATION,
  DELETE_COLUMN_MUTATION,
} from "@/graphql/board";

interface ColumnProps {
  column: ColumnType;
  index: number;
  boardId: string;
  board: Board;
  onBoardChange: (board: Board) => void;
}

export default function Column({
  column,
  index,
  boardId,
  board,
  onBoardChange,
}: ColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.100", "gray.700");
  const columnBg = useColorModeValue("white", "gray.800");

  // Add GraphQL mutation hooks
  const [addCardMutation, { loading: isAddingCardMutation }] =
    useMutation(ADD_CARD);
  const [updateColumnMutation] = useMutation(UPDATE_COLUMN_MUTATION);
  const [deleteColumnMutation] = useMutation(DELETE_COLUMN_MUTATION);

  const findCardByProperties = (boardData, title, columnId) => {
    for (const column of boardData.columns) {
      if (column.id === columnId) {
        return column.cards.find((card) => card.title === title);
      }
    }
    return null;
  };

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    try {
      // STEP 1: Get current board state from props or context
      const currentBoard = board; // Access your current board state

      // STEP 2: Create a new card (optimistic update)
      const optimisticCardId = `temp-${Date.now()}`;
      const newCard = {
        id: optimisticCardId,
        title: newCardTitle.trim(),
        columnId: column.id,
        createdAt: new Date().toISOString(),
        // Add other default properties your cards have
      };

      // STEP 3: Create updated board with preserved column order
      const updatedBoard = { ...currentBoard };

      // Find the column index while maintaining the current order
      const columnIndex = updatedBoard.columns.findIndex(
        (col) => col.id === column.id
      );

      if (columnIndex !== -1) {
        // Clone the columns array and update the specific column's cards
        updatedBoard.columns = [...updatedBoard.columns];
        updatedBoard.columns[columnIndex] = {
          ...updatedBoard.columns[columnIndex],
          cards: [...updatedBoard.columns[columnIndex].cards, newCard],
        };

        // STEP 4: Update UI immediately (optimistic update)
        onBoardChange(updatedBoard);
      }

      // STEP 5: Make the API call
      const { data } = await addCardMutation({
        variables: {
          columnId: column.id,
          input: {
            title: newCardTitle.trim(),
          },
        },
      });

      // STEP 6: Merge the server response while preserving column order
      if (data?.addCard) {
        // Find the real card from the response that matches our temporary card
        const serverCard = findCardByProperties(
          data.addCard,
          newCardTitle.trim(),
          column.id
        );

        if (serverCard) {
          // Update only that specific card in our current board state
          const finalBoard = { ...updatedBoard };
          const colIndex = finalBoard.columns.findIndex(
            (col) => col.id === column.id
          );

          if (colIndex !== -1) {
            const cardIndex = finalBoard.columns[colIndex].cards.findIndex(
              (c) => c.id === optimisticCardId
            );

            if (cardIndex !== -1) {
              // Replace our optimistic card with the real one from server
              finalBoard.columns[colIndex].cards[cardIndex] = serverCard;
              onBoardChange(finalBoard);
            }
          }
        }
      }

      setNewCardTitle("");
      setIsAddingCard(false);

      toast({
        title: "Card added",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to add card:", error);
      toast({
        title: "Error",
        description: "Failed to add card",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const updateColumnTitle = async () => {
    if (!columnTitle.trim()) {
      setColumnTitle(column.title); // Reset to original if empty
      setIsEditingTitle(false);
      return;
    }

    try {
      const { data } = await updateColumnMutation({
        variables: {
          columnId: column.id,
          input: {
            title: columnTitle.trim(),
          },
        },
      });

      // If your mutation returns the full board:
      // onBoardChange(data.updateColumn);

      setIsEditingTitle(false);

      toast({
        title: "Column updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to update column title:", error);
      toast({
        title: "Error",
        description: "Failed to update column title",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      // Reset to original title
      setColumnTitle(column.title);
    }
  };

  const handleDeleteColumn = async () => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to delete the "${column.title}" list and all its cards?`
      );

      if (!confirmed) return;

      // Show loading state
      toast({
        title: "Deleting list...",
        status: "loading",
        duration: null,
        isClosable: false,
        id: "delete-column-toast",
      });

      const { data } = await deleteColumnMutation({
        variables: {
          columnId: column.id,
        },
      });

      onBoardChange(data.deleteColumn);

      // Close loading toast and show success
      toast.close("delete-column-toast");
      toast({
        title: "List deleted",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast.close("delete-column-toast");
      console.error("Failed to delete column:", error);
      toast({
        title: "Error",
        description: "Failed to delete column",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCardUpdate = (updatedCard) => {
    // Find and update the specific card within this column
    const updatedCards = column.cards.map((card) =>
      card.id === updatedCard.id ? updatedCard : card
    );

    // Create updated column with new cards array
    const updatedColumn = {
      ...column,
      cards: updatedCards,
    };

    // Pass this change up to the board level
    onBoardChange({
      ...board,
      columns: board.columns.map((col) =>
        col.id === column.id ? updatedColumn : col
      ),
    });
  };

  // Add this function in your Column component
  const handleDeleteCard = (cardId: string) => {
    // Remove the card from this column's cards array
    const updatedCards = column.cards.filter((card) => card.id !== cardId);

    // Create an updated column with the card removed
    const updatedColumn = {
      ...column,
      cards: updatedCards,
    };

    const updatedBoard = {
      ...board,
      columns: board.columns.map((col) =>
        col.id === column.id ? updatedColumn : col
      ),
    };

    onBoardChange(updatedBoard);
  };

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          minW="280px"
          maxW="280px"
          marginRight={2}
          height="fit-content"
          bg={columnBg}
          borderRadius="md"
          boxShadow="sm"
        >
          {/* Column Header */}
          <Flex
            p={2}
            align="center"
            justify="space-between"
            bg={bgColor}
            borderTopRadius="md"
            {...provided.dragHandleProps}
          >
            {isEditingTitle ? (
              <Input
                ref={inputRef}
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                onBlur={updateColumnTitle}
                onKeyPress={(e) => e.key === "Enter" && updateColumnTitle()}
                size="sm"
                autoFocus
                maxW="200px"
              />
            ) : (
              <Heading
                size="sm"
                onClick={() => {
                  setIsEditingTitle(true);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                cursor="pointer"
                p={1}
                isTruncated
              >
                {column.title}
              </Heading>
            )}

            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Column options"
                icon={<FiMoreHorizontal />}
                variant="ghost"
                size="sm"
              />
              <MenuList>
                <MenuItem
                  icon={<FiEdit2 />}
                  onClick={() => {
                    setIsEditingTitle(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                >
                  Edit title
                </MenuItem>
                <MenuItem icon={<FiTrash2 />} onClick={handleDeleteColumn}>
                  Delete column
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>

          {/* Column Content - Cards */}
          <Droppable
            droppableId={column.id}
            type="CARD"
            isDropDisabled={false} // Explicitly set to false
          >
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                minH="20px"
                p={2}
                bg={snapshot.isDraggingOver ? bgColor : "transparent"}
                transition="background-color 0.2s ease"
              >
                {Array.isArray(column.cards) &&
                  [...column.cards] // Create a copy with spread operator
                    .sort((a, b) => a.order - b.order)
                    .map((card, cardIndex) => (
                      <Card
                        key={card.id}
                        card={card}
                        index={cardIndex}
                        columnId={column.id}
                        boardId={boardId}
                        onCardUpdate={handleCardUpdate}
                        onCardDelete={handleDeleteCard}
                      />
                    ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>

          {/* Add Card Section */}
          <Box p={2}>
            {isAddingCard ? (
              <Box mb={2}>
                <Input
                  placeholder="Enter card title..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCard()}
                  size="sm"
                  mb={2}
                  autoFocus
                />
                <Flex>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={handleAddCard}
                    mr={2}
                    isLoading={isAddingCardMutation}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsAddingCard(false);
                      setNewCardTitle("");
                    }}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Box>
            ) : (
              <Button
                leftIcon={<FiPlus />}
                onClick={() => setIsAddingCard(true)}
                size="sm"
                width="100%"
                variant="ghost"
              >
                Add a card
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Draggable>
  );
}
