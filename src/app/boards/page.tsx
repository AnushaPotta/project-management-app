"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  useToast,
  Spinner,
  Text,
  SimpleGrid,
  Flex,
  Icon,
  useColorModeValue,
  HStack,
  Tooltip,
} from "@chakra-ui/react";
import { FiPlus, FiAlertCircle, FiRefreshCw, FiHome, FiLayout } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateBoardModal } from "@/components/board/CreateBoardModal";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USER_BOARDS, CREATE_BOARD } from "@/graphql/board";
import { Board } from "@/types/board";
import { getAuth } from "firebase/auth";

interface CreateBoardInput {
  title: string;
  description?: string;
}

interface CreateBoardResult {
  createBoard: Board;
}

export default function BoardsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const toast = useToast();
  const router = useRouter();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");

  // GraphQL query to fetch all boards with improved fetch policies
  const {
    data,
    loading: isLoading,
    error: queryError,
    refetch,
  } = useQuery<{ boards: Board[] }>(GET_USER_BOARDS, {
    fetchPolicy: "cache-first", // First use cache
    nextFetchPolicy: "cache-and-network", // Then network
    notifyOnNetworkStatusChange: true,
  });

  // Smarter useEffect with auth awareness
  useEffect(() => {
    const auth = getAuth();

    // Only refetch when we have a logged-in user
    if (auth.currentUser) {
      console.log("User authenticated, refetching boards");

      // Add a small delay to ensure auth token is ready
      const timer = setTimeout(() => {
        refetch()
          .then((result) => {
            console.log(
              "Refetch complete, boards count:",
              result.data?.boards?.length || 0
            );
            setIsInitialLoad(false);
          })
          .catch((error) => {
            console.error("Refetch error:", error);
            setIsInitialLoad(false);
          });
      }, 500);

      return () => clearTimeout(timer);
    } else {
      console.log("No authenticated user yet, waiting for auth");
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          console.log("User authenticated in listener, refetching boards");
          refetch()
            .then((result) => {
              console.log(
                "Refetch complete, boards count:",
                result.data?.boards?.length || 0
              );
              setIsInitialLoad(false);
            })
            .catch((error) => {
              console.error("Refetch error:", error);
              setIsInitialLoad(false);
            });
        } else {
          setIsInitialLoad(false);
        }
      });

      return () => unsubscribe();
    }
  }, [refetch]);

  // GraphQL mutation to create a board with improved cache handling
  const [createBoardMutation, { loading: isCreating }] = useMutation<
    CreateBoardResult,
    { title: string, description?: string }
  >(CREATE_BOARD, {
    update(cache, { data }) {
      if (!data) return;

      try {
        // Read the current cache
        const existingData = cache.readQuery<{ boards: Board[] }>({
          query: GET_USER_BOARDS,
        });

        console.log(
          "Existing boards in cache:",
          existingData?.boards?.length || 0
        );

        // Add isStarred field with default value if it's missing
        const newBoard = {
          ...data.createBoard,
          isStarred: data.createBoard.isStarred ?? false // Default to false if not present
        };

        // Write back to the cache with the new board included
        cache.writeQuery({
          query: GET_USER_BOARDS,
          data: {
            boards: existingData?.boards
              ? [...existingData.boards, newBoard]
              : [newBoard],
          },
        });

        console.log("Updated cache with new board");
      } catch (error) {
        console.error("Error updating cache:", error);
        // If cache update fails, fallback to refetch
        refetch();
      }
    },
    onCompleted: () => {
      setIsCreateModalOpen(false);
      toast({
        title: "Board created",
        description: "Your new board has been created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (err) => {
      console.error("Failed to create board:", err);
      toast({
        title: "Error",
        description: "Failed to create board. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Extract boards from the GraphQL response
  const boards: Board[] = data?.boards || [];

  const handleCreateBoard = async (boardData: CreateBoardInput) => {
    try {
      await createBoardMutation({
        variables: {
          title: boardData.title,
          description: boardData.description,
        },
      });
      // The onCompleted and onError callbacks will handle the rest
    } catch (err) {
      // This catch is for unexpected errors that might not be caught by onError
      console.error("Unexpected error creating board:", err);
    }
  };

  // Manual refresh function for the debug button
  const handleManualRefresh = async () => {
    try {
      console.log("Manual refresh - Current auth:", getAuth().currentUser?.uid);
      console.log("Current cache data:", data?.boards?.length || 0, "boards");

      const result = await refetch();
      console.log(
        "Manual refresh result:",
        result.data?.boards?.length || 0,
        "boards"
      );

      toast({
        title: "Boards refreshed",
        description: `Found ${result.data?.boards?.length || 0} boards`,
        status: "info",
        duration: 2000,
      });
    } catch (error) {
      console.error("Manual refresh error:", error);
    }
  };

  const renderBoardList = () => {
    const boards = data?.boards || [];

    if (boards.length === 0) {
      return (
        <Box textAlign="center" py={10}>
          <Heading size="md" mb={4}>
            No boards yet
          </Heading>
          <Text mb={6}>Create your first board to get started</Text>
          <Button
            colorScheme="blue"
            leftIcon={<FiPlus />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Your First Board
          </Button>
        </Box>
      );
    }

    // Separate boards into starred and regular
    const starredBoards = boards.filter((board) => board.isStarred);
    const regularBoards = boards.filter((board) => !board.isStarred);

    // Board card renderer function to avoid code duplication
    const renderBoardCard = (board: Board) => (
      <Box
        as={Link}
        href={`/boards/${board.id}`}
        key={board.id}
        p={5}
        borderWidth="1px"
        borderRadius="md"
        borderColor={borderColor}
        bg={bgColor}
        _hover={{
          bg: hoverBgColor,
          transform: "translateY(-2px)",
          boxShadow: "md",
          transition: "all 0.2s ease-in-out",
        }}
        transition="all 0.2s"
        height="160px"
        position="relative"
      >
        <Heading size="md" mb={2} noOfLines={1}>
          {board.title}
        </Heading>

        {board.description && (
          <Text color="gray.500" noOfLines={2} mb={4}>
            {board.description}
          </Text>
        )}

        <Text
          fontSize="sm"
          color="gray.500"
          position="absolute"
          bottom="5"
          left="5"
        >
          {board.columns?.length || 0} columns •{" "}
          {board.columns?.reduce(
            (count, col) => count + (col.cards?.length || 0),
            0
          ) || 0}{" "}
          cards
        </Text>

        {board.isStarred && (
          <Box position="absolute" top="3" right="3" color="yellow.400">
            ★
          </Box>
        )}
      </Box>
    );

    return (
      <Box>
        {/* Starred Boards Section */}
        {starredBoards.length > 0 && (
          <>
            <Flex align="center" mt={6} mb={4}>
              <Box color="yellow.400" mr={2}>★</Box>
              <Heading size="md">Starred Boards</Heading>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} mb={8}>
              {starredBoards.map((board) => renderBoardCard(board))}
            </SimpleGrid>
          </>
        )}

        {/* Regular Boards Section */}
        <Heading size="md" mb={4} mt={6}>
          {starredBoards.length > 0 ? "All Boards" : "Your Boards"}
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
          {regularBoards.map((board) => renderBoardCard(board))}

          <Flex
            justify="center"
            align="center"
            p={5}
            borderWidth="1px"
            borderRadius="md"
            borderStyle="dashed"
            borderColor={borderColor}
            bg={bgColor}
            _hover={{ bg: hoverBgColor }}
            cursor="pointer"
            height="160px"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Flex direction="column" align="center">
              <Icon as={FiPlus} w={8} h={8} mb={3} />
              <Text fontWeight="medium">Create New Board</Text>
            </Flex>
          </Flex>
        </SimpleGrid>
      </Box>
    );
  };

  const renderContent = () => {
    if (isLoading && isInitialLoad) {
      return (
        <Flex direction="column" align="center" justify="center" py={10}>
          <Spinner size="xl" mb={4} />
          <Text>Loading your boards...</Text>
        </Flex>
      );
    }

    if (queryError) {
      return (
        <Flex direction="column" align="center" justify="center" py={10}>
          <Icon as={FiAlertCircle} w={10} h={10} color="red.500" mb={4} />
          <Text mb={4}>Failed to load your boards. Please try again.</Text>
          <Button onClick={() => refetch()}>Try Again</Button>
        </Flex>
      );
    }

    return renderBoardList();
  };

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Flex
        justify="space-between"
        align="center"
        mb={6}
        direction={{ base: "column", sm: "row" }}
        gap={{ base: 4, sm: 0 }}
      >
        <Heading size="lg">Your Boards</Heading>
        <HStack spacing={2}>
          <Tooltip label="Home">
            <Button
              leftIcon={<FiHome />}
              size="sm"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Home
            </Button>
          </Tooltip>
          <Tooltip label="Dashboard">
            <Button
              leftIcon={<FiLayout />}
              size="sm"
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
          </Tooltip>
          <Button
            leftIcon={<FiRefreshCw />}
            size="sm"
            colorScheme="teal"
            onClick={handleManualRefresh}
            isLoading={isLoading && !isInitialLoad}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => setIsCreateModalOpen(true)}
            width={{ base: "full", sm: "auto" }}
          >
            Create Board
          </Button>
        </HStack>
      </Flex>

      {renderContent()}

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateBoard={handleCreateBoard}
        isCreating={isCreating}
      />
    </Box>
  );
}
