// src/components/board/Column.tsx
"use client";

import { useState, useRef } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useToast,
} from "@chakra-ui/react";
import { FiPlus, FiMoreHorizontal, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "./Card";
import { useBoard } from "@/contexts/board-context";
import { Column as ColumnType } from "@/types/board";
import { handleError } from "@/utils/error-handling";

interface ColumnProps {
  column: ColumnType;
  index: number;
  boardId: string;
  onAddCard: () => void;
}

export default function Column({ column, index, onAddCard }: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateColumn, deleteColumn } = useBoard();

  const handleTitleUpdate = async () => {
    if (columnTitle.trim() === "") return;

    try {
      await updateColumn(column.id, { title: columnTitle });
      setIsEditingTitle(false);
      toast({
        title: "Column title updated",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  const handleDeleteColumn = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this column and all its cards?"
      )
    ) {
      return;
    }

    try {
      await deleteColumn(column.id);
      toast({
        title: "Column deleted",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          minW="272px"
          maxW="272px"
          h="fit-content"
          bg="gray.100"
          borderRadius="md"
          mr={2}
          display="flex"
          flexDirection="column"
        >
          <Flex
            p={2}
            align="center"
            justify="space-between"
            {...provided.dragHandleProps}
          >
            {isEditingTitle ? (
              <Input
                ref={inputRef}
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                size="sm"
                onBlur={handleTitleUpdate}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleTitleUpdate();
                  }
                }}
                autoFocus
              />
            ) : (
              <Heading
                size="sm"
                fontWeight="semibold"
                onClick={() => {
                  setIsEditingTitle(true);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                cursor="pointer"
                flex="1"
                isTruncated
              >
                {column.title}
              </Heading>
            )}

            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMoreHorizontal />}
                variant="ghost"
                size="sm"
                aria-label="Column menu"
              />
              <MenuList>
                <MenuItem
                  icon={<FiEdit2 />}
                  onClick={() => setIsEditingTitle(true)}
                >
                  Edit title
                </MenuItem>
                <MenuItem icon={<FiTrash2 />} onClick={handleDeleteColumn}>
                  Delete column
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>

          <Droppable droppableId={column.id} type="card">
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                minH="10px"
                p={2}
                flex="1"
              >
                {column.cards.length > 0 ? (
                  column.cards
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((card, cardIndex) => (
                      <Card
                        key={card.id}
                        card={card}
                        index={cardIndex}
                        columnId={column.id}
                      />
                    ))
                ) : (
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    textAlign="center"
                    py={2}
                  >
                    No cards yet
                  </Text>
                )}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>

          <Box p={2}>
            <Button
              leftIcon={<Icon as={FiPlus} />}
              variant="ghost"
              size="sm"
              width="full"
              justifyContent="flex-start"
              onClick={onAddCard}
            >
              Add a card
            </Button>
          </Box>
        </Box>
      )}
    </Draggable>
  );
}
