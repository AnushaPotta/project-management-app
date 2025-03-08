"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
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
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FiPlus, FiMoreHorizontal, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "./Card";
import AddCardModal from "./AddCardModal";

const GET_CARDS = gql`
  query GetCards($columnId: ID!) {
    cards(columnId: $columnId) {
      id
      title
      description
      order
    }
  }
`;

const UPDATE_COLUMN = gql`
  mutation UpdateColumn($id: ID!, $title: String!) {
    updateColumn(id: $id, title: $title) {
      id
      title
    }
  }
`;

const DELETE_COLUMN = gql`
  mutation DeleteColumn($id: ID!) {
    deleteColumn(id: $id)
  }
`;

interface ColumnProps {
  column: {
    id: string;
    title: string;
    boardId: string;
    order: number;
  };
  index: number;
  boardId: string;
}

export default function Column({ column, index, boardId }: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, loading, error } = useQuery(GET_CARDS, {
    variables: { columnId: column.id },
    fetchPolicy: "network-only",
  });

  const [updateColumn] = useMutation(UPDATE_COLUMN);
  const [deleteColumn] = useMutation(DELETE_COLUMN, {
    refetchQueries: [
      {
        query: gql`
          query GetColumns($boardId: ID!) {
            columns(boardId: $boardId) {
              id
              title
              boardId
              order
            }
          }
        `,
        variables: { boardId },
      },
    ],
  });

  const handleTitleUpdate = () => {
    if (columnTitle.trim() === "") return;

    updateColumn({
      variables: {
        id: column.id,
        title: columnTitle,
      },
    })
      .then(() => {
        setIsEditingTitle(false);
        toast({
          title: "Column title updated",
          status: "success",
          duration: 2000,
        });
      })
      .catch((error) => {
        toast({
          title: "Error updating column title",
          description: error.message,
          status: "error",
          duration: 3000,
        });
      });
  };

  const handleDeleteColumn = () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this column and all its cards?"
      )
    ) {
      return;
    }

    deleteColumn({
      variables: {
        id: column.id,
      },
    })
      .then(() => {
        toast({
          title: "Column deleted",
          status: "success",
          duration: 2000,
        });
      })
      .catch((error) => {
        toast({
          title: "Error deleting column",
          description: error.message,
          status: "error",
          duration: 3000,
        });
      });
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
                {loading ? (
                  <Text fontSize="sm" color="gray.500">
                    Loading cards...
                  </Text>
                ) : error ? (
                  <Text fontSize="sm" color="red.500">
                    Error loading cards
                  </Text>
                ) : (
                  data.cards
                    .slice()
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((card: any, index: number) => (
                      <Card
                        key={card.id}
                        card={card}
                        index={index}
                        columnId={column.id}
                      />
                    ))
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
              onClick={onOpen}
            >
              Add a card
            </Button>
          </Box>

          <AddCardModal
            isOpen={isOpen}
            onClose={onClose}
            columnId={column.id}
          />
        </Box>
      )}
    </Draggable>
  );
}
