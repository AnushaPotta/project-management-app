"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, gql, ApolloCache } from "@apollo/client";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Input,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FiPlus, FiMoreHorizontal, FiEdit2 } from "react-icons/fi";
import Column from "@/components/board/Column";
import AddColumnModal from "@/components/board/AddColumnModal";

// Define types for our GraphQL data
interface Board {
  id: string;
  title: string;
}

interface Column {
  id: string;
  title: string;
  boardId: string;
  order: number;
}

interface BoardData {
  board: Board;
  columns: Column[];
}

const GET_BOARD = gql`
  query GetBoard($id: ID!) {
    board(id: $id) {
      id
      title
    }
    columns(boardId: $id) {
      id
      title
      boardId
      order
    }
  }
`;

const UPDATE_BOARD = gql`
  mutation UpdateBoard($id: ID!, $title: String!) {
    updateBoard(id: $id, title: $title) {
      id
      title
    }
  }
`;

const MOVE_COLUMN = gql`
  mutation MoveColumn($id: ID!, $order: Int!) {
    moveColumn(id: $id, order: $order) {
      id
      order
    }
  }
`;

const MOVE_CARD = gql`
  mutation MoveCard($id: ID!, $columnId: ID!, $order: Int!) {
    moveCard(id: $id, columnId: $columnId, order: $order) {
      id
      columnId
      order
    }
  }
`;

export default function BoardPage({ params }: { params: { boardId: string } }) {
  const { boardId } = params;
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");

  const { data, loading, error } = useQuery<BoardData>(GET_BOARD, {
    variables: { id: boardId },
    fetchPolicy: "network-only",
  });

  const [updateBoard] = useMutation(UPDATE_BOARD);
  const [moveColumn] = useMutation(MOVE_COLUMN);
  const [moveCard] = useMutation(MOVE_CARD);

  useEffect(() => {
    if (data?.board) {
      setBoardTitle(data.board.title);
    }
  }, [data]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // If there's no destination or if the item was dropped in the same position
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // If a column was dragged
    if (type === "column") {
      moveColumn({
        variables: {
          id: draggableId,
          order: destination.index,
        },
        optimisticResponse: {
          moveColumn: {
            id: draggableId,
            order: destination.index,
            __typename: "Column",
          },
        },
        update: (cache: ApolloCache<BoardData>) => {
          // Update the cache to reflect the new order
          const cachedData = cache.readQuery<BoardData>({
            query: GET_BOARD,
            variables: { id: boardId },
          });

          if (!cachedData) return;

          const newColumns = [...cachedData.columns];
          const movedColumn = newColumns.find((col) => col.id === draggableId);

          if (!movedColumn) return;

          // Remove the column from its old position
          newColumns.splice(source.index, 1);
          // Insert it at the new position
          newColumns.splice(destination.index, 0, movedColumn);

          // Update the order property for all columns
          const updatedColumns = newColumns.map((col, index) => ({
            ...col,
            order: index,
          }));

          cache.writeQuery({
            query: GET_BOARD,
            variables: { id: boardId },
            data: {
              ...cachedData,
              columns: updatedColumns,
            },
          });
        },
      }).catch((error: Error) => {
        toast({
          title: "Error moving column",
          description: error.message,
          status: "error",
          duration: 3000,
        });
      });

      return;
    }

    // If a card was dragged
    moveCard({
      variables: {
        id: draggableId,
        columnId: destination.droppableId,
        order: destination.index,
      },
    }).catch((error: Error) => {
      toast({
        title: "Error moving card",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    });
  };

  const handleTitleUpdate = () => {
    if (boardTitle.trim() === "") return;

    updateBoard({
      variables: {
        id: boardId,
        title: boardTitle,
      },
    })
      .then(() => {
        setIsEditingTitle(false);
        toast({
          title: "Board title updated",
          status: "success",
          duration: 2000,
        });
      })
      .catch((error: Error) => {
        toast({
          title: "Error updating board title",
          description: error.message,
          status: "error",
          duration: 3000,
        });
      });
  };

  if (loading) return <Box p={8}>Loading board...</Box>;
  if (error) return <Box p={8}>Error loading board: {error.message}</Box>;
  if (!data) return <Box p={8}>No board data found</Box>;

  return (
    <Box height="calc(100vh - 64px)" display="flex" flexDirection="column">
      <Flex
        p={4}
        justify="space-between"
        align="center"
        borderBottomWidth="1px"
        borderColor="gray.200"
      >
        {isEditingTitle ? (
          <Flex>
            <Input
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              size="lg"
              fontWeight="bold"
              width="auto"
              mr={2}
            />
            <Button onClick={handleTitleUpdate}>Save</Button>
          </Flex>
        ) : (
          <Heading
            size="lg"
            onClick={() => setIsEditingTitle(true)}
            cursor="pointer"
            display="flex"
            alignItems="center"
          >
            {data.board.title}
            <Icon as={FiEdit2} ml={2} fontSize="sm" />
          </Heading>
        )}

        <IconButton
          aria-label="Board menu"
          icon={<FiMoreHorizontal />}
          variant="ghost"
        />
      </Flex>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable
          droppableId="all-columns"
          direction="horizontal"
          type="column"
        >
          {(provided) => (
            <Flex
              flex="1"
              overflowX="auto"
              p={4}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {data.columns
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((column, index) => (
                  <Column
                    key={column.id}
                    column={column}
                    index={index}
                    boardId={boardId}
                  />
                ))}
              {provided.placeholder}

              <Button
                minW="272px"
                h="40px"
                leftIcon={<Icon as={FiPlus} />}
                onClick={onOpen}
                variant="ghost"
                justifyContent="flex-start"
                borderRadius="md"
                ml={2}
              >
                Add another list
              </Button>
            </Flex>
          )}
        </Droppable>
      </DragDropContext>

      <AddColumnModal isOpen={isOpen} onClose={onClose} boardId={boardId} />
    </Box>
  );
}
