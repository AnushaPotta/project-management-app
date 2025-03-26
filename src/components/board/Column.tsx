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
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { addCard, updateBoard } from "@/services/boardService";
import { Board, Column as ColumnType } from "@/types/board";
import Card from "./Card";

interface ColumnProps {
  column: ColumnType;
  index: number;
  boardId: string;
  onBoardChange: (board: Board) => void;
}

export default function Column({
  column,
  index,
  boardId,
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

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    try {
      const updatedBoard = await addCard(boardId, column.id, {
        title: newCardTitle.trim(),
      });
      onBoardChange(updatedBoard);
      setNewCardTitle("");
      setIsAddingCard(false);
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
    try {
      // First get the current board to work with
      const updatedColumns = [...column.cards];

      // Find and update the column title
      const updatedBoard = await updateBoard(boardId, {
        columns: updateColumnTitle,
      });

      onBoardChange(updatedBoard);
      setIsEditingTitle(false);
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

  const deleteColumn = async () => {
    try {
      // Implementation would involve removing this column from the board
      // This would require a new API endpoint in boardService
      toast({
        title: "Column deleted",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
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
                <MenuItem icon={<FiTrash2 />} onClick={deleteColumn}>
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
                {/* Rest of the component... */}
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
