"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  useDisclosure,
} from "@chakra-ui/react";
import { FiPlus, FiStar, FiSettings } from "react-icons/fi";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useQuery, useMutation } from "@apollo/client";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  GET_BOARD,
  UPDATE_BOARD,
  ADD_COLUMN,
  MOVE_CARD,
  MOVE_COLUMN,
  INVITE_MEMBER,
  REMOVE_MEMBER,
  DELETE_BOARD,
} from "@/graphql/board";
import { Board } from "@/types/board";
import Column from "@/components/board/Column";
import AddColumnModal from "@/components/board/AddColumnModal";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardMembers } from "@/components/board/BoardMembers";

export default function BoardPage() {
  const { boardId } = useParams();
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const toast = useToast();
  
  // Get current user
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

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
  const [inviteMemberMutation] = useMutation(INVITE_MEMBER);
  const [removeMemberMutation] = useMutation(REMOVE_MEMBER);
  const [deleteBoardMutation] = useMutation(DELETE_BOARD);

  // Modal for members management
  const { 
    isOpen: isMembersModalOpen, 
    onOpen: openMembersModal, 
    onClose: closeMembersModal 
  } = useDisclosure();

  // Set board from query data
  useEffect(() => {
    console.log("Query data received:", data);
    if (data?.board && currentUser) {
      console.log("Setting board from query data:", data.board);
      // Log members specifically to debug
      console.log("Board members from server:", data.board.members);
      
      // If no members, add the current user as an admin member
      if (!data.board.members || data.board.members.length === 0) {
        console.log("No members found in data, adding current user as admin");
        
        // Create board with the current user as admin
        const boardWithAdmin = {
          ...data.board,
          members: [
            {
              id: currentUser.uid,
              name: currentUser.displayName || currentUser.email || 'Admin',
              email: currentUser.email || '',
              role: 'ADMIN',
              status: 'ACCEPTED'
            }
          ]
        };
        setBoard(boardWithAdmin);
      } else {
        setBoard(data.board);
      }
    } else if (data?.board) {
      // If we don't have the current user yet, just set the board as is
      setBoard(data.board);
    }
  }, [data, currentUser]);

  useEffect(() => {
    if (board?.columns && board.columns.length > 0) {
      // Only initialize column order once when board first loads
      if (!isInitialized) {
        const colIds = board.columns.map((col) => col.id);
        console.log("Setting column order:", colIds);
        setColumnOrder(colIds);
        setIsInitialized(true);
      }
    }
  }, [board, isInitialized]);

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

    // For column reordering
    if (type === "column") {
      try {
        // Create a new order array
        const newColumnOrder = Array.from(columnOrder);
        newColumnOrder.splice(source.index, 1);
        newColumnOrder.splice(destination.index, 0, columnOrder[source.index]);

        // Update local state immediately for responsive UI
        setColumnOrder(newColumnOrder);

        // Create a new board with reordered columns
        const updatedColumns = newColumnOrder
          .map((colId) => board.columns.find((col) => col.id === colId))
          .filter(Boolean);

        const updatedBoard = {
          ...board,
          columns: updatedColumns,
        };

        // Update board state immediately
        setBoard(updatedBoard);

        // Call server mutation
        await moveColumnMutation({
          variables: {
            boardId: board.id,
            columnId: columnOrder[source.index],
            sourceIndex: source.index,
            destinationIndex: destination.index,
          },
          // Important: Tell Apollo to update the cache with our local changes
          optimisticResponse: {
            __typename: "Mutation",
            moveColumn: updatedBoard,
          },
          update: (cache) => {
            // This prevents Apollo from reverting our local state
            // We're saying: "Don't update the UI based on server response"
            // Instead, keep using our optimistic result
          },
        });
      } catch (error) {
        console.error("Error moving column:", error);
        // Revert to the original state if there's an error
        refetch();
        toast({
          title: "Error moving column",
          status: "error",
        });
      }
      return;
    }

    // For card moving
    if (type === "CARD") {
      try {
        // Keep a copy of the board BEFORE any updates
        const prevBoard = JSON.parse(JSON.stringify(board));

        // Create an optimistic update for the UI
        const newBoard = { ...board };

        // Get the card to move without immediately removing it
        const cardToMove = newBoard.columns.find(
          (col) => col.id === source.droppableId
        )?.cards[source.index];
        if (!cardToMove) {
          console.error("Card not found at source index");
          return;
        }

        // Create a copy of the card
        const movedCard = { ...cardToMove };

        // Update the card's properties to match its new location
        movedCard.columnId = destination.droppableId;
        movedCard.order = destination.index;

        // Create new board with modified columns
        const updatedBoard = {
          ...newBoard,
          columns: newBoard.columns.map((column) => {
            // Source column: filter out the moved card
            if (column.id === source.droppableId) {
              const updatedCards = column.cards
                .filter((card) => card.id !== cardToMove.id)
                .map((card, idx) => ({
                  ...card,
                  order: idx,
                }));

              return {
                ...column,
                cards: updatedCards,
              };
            }

            // Destination column: insert the moved card
            if (column.id === destination.droppableId) {
              const beforeCards = column.cards.slice(0, destination.index);
              const afterCards = column.cards.slice(destination.index);

              const updatedCards = [
                ...beforeCards,
                movedCard,
                ...afterCards,
              ].map((card, idx) => ({
                ...card,
                order: idx,
              }));

              return {
                ...column,
                cards: updatedCards,
              };
            }

            // Other columns remain unchanged
            return column;
          }),
        };

        // Update the board state immediately for responsive UI
        setBoard(updatedBoard);

        // Now call the mutation with our updated board
        try {
          await moveCardMutation({
            variables: {
              boardId: board.id,
              source: {
                columnId: source.droppableId,
                index: source.index,
              },
              destination: {
                columnId: destination.droppableId,
                index: destination.index,
              },
            },
            optimisticResponse: {
              __typename: "Mutation",
              moveCard: updatedBoard,
            },
          });
        } catch (error) {
          console.error("Error sending card move mutation:", error);
          toast({
            title: "Error saving card position",
            status: "error",
          });
        }
      } catch (error) {
        console.error("Error moving card:", error);
        toast({
          title: "Error moving card",
          status: "error",
        });
      }
    }
  };

  // These functions should be at component level, not inside handleDragEnd
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

        // Update column order with the new column
        if (data.addColumn.columns) {
          const newColIds = data.addColumn.columns.map((col) => col.id);
          setColumnOrder(newColIds);
        }

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

  // Handle inviting a member by email
  const handleInviteMember = async (email: string) => {
    try {
      console.log(`Attempting to invite ${email} to board ${board?.id}`);
      
      const { data } = await inviteMemberMutation({
        variables: {
          boardId: board?.id,
          email,
        },
      });
      
      console.log("Invitation response:", data);
      
      if (data?.inviteMember) {
        // Check if the current admin user is still in the returned members list
        const adminMember = board!.members.find(m => m.role === 'ADMIN' && m.id === currentUser?.uid);
        const newMembersList = data.inviteMember.members;
        
        // If admin isn't in the returned list but was in our local state, keep them
        if (adminMember && !newMembersList.some(m => m.id === adminMember.id)) {
          console.log("Preserving admin in members list", adminMember);
          newMembersList.push(adminMember);
        }
        
        // Update the board state with the combined member list
        setBoard({
          ...board!,
          members: newMembersList,
        });
        
        toast({
          title: "Member invited",
          description: `Invitation sent to ${email}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        return true;
      } else {
        throw new Error("Invitation failed, no data returned");
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      handleError(error, toast);
      throw error; // Re-throw to allow the component to handle it
    }
  };
  
  // Handle board deletion and redirect to boards page
  const handleDeleteBoard = async () => {
    try {
      if (!board) return;
      
      const confirmed = window.confirm(`Are you sure you want to delete the board "${board.title}"? This action cannot be undone.`);
      
      if (!confirmed) return;
      
      await deleteBoardMutation({
        variables: { id: board.id },
      });
      
      toast({
        title: "Board deleted",
        description: "The board has been permanently deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect to boards page
      router.push("/boards");
    } catch (error) {
      handleError(error, toast);
    }
  };

  // Handle removing a member from the board
  const handleRemoveMember = async (memberId: string) => {
    try {
      const { data } = await removeMemberMutation({
        variables: {
          boardId: board?.id,
          memberId,
        },
      });
      
      if (data?.removeMember) {
        // Update the board state with the member removed
        setBoard({
          ...board!,
          members: data.removeMember.members,
        });
        
        toast({
          title: "Member removed",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      handleError(error, toast);
    }
  };

  // Add debug info to see if query is loading or if there's an error
  console.log("Is loading:", isLoading);
  console.log("Query error:", queryError);
  console.log("Board ID from params:", boardId);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (queryError) {
    return (
      <Flex direction="column" align="center" justify="center" height="80vh">
        <Text mb={4}>Error: {queryError.message}</Text>
        <Button onClick={() => refetch()}>Try Again</Button>
      </Flex>
    );
  }

  if (!board) {
    return (
      <Flex direction="column" align="center" justify="center" height="80vh">
        <Text mb={4}>
          Board not found. Check the console for debugging info.
        </Text>
        <Button onClick={() => refetch()}>Try Again</Button>
      </Flex>
    );
  }

  return (
    <Box height="100vh" bg={bgColor} display="flex" flexDirection="column">
      {/* Board Header */}
      <BoardHeader 
        title={board.title}
        members={board.members?.length || 0}
        isStarred={board.isStarred}
        onTitleChange={(newTitle) => {
          updateBoardMutation({
            variables: {
              id: board.id,
              input: { title: newTitle },
            },
          }).then((result) => {
            if (result.data?.updateBoard) {
              setBoard({
                ...board,
                title: newTitle,
              });
            }
          }).catch((error) => handleError(error, toast));
        }}
        onToggleStar={toggleBoardStar}
        onInviteMember={openMembersModal}
        onDelete={handleDeleteBoard}
      />
      
      <BoardMembers
        members={board.members || []}
        onInviteMember={handleInviteMember}
        onRemoveMember={handleRemoveMember}
        isOpen={isMembersModalOpen}
        onClose={closeMembersModal}
      />

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
            type="column"
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
                      board={board}
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
