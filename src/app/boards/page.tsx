"use client";

import { useState } from "react";
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
} from "@chakra-ui/react";
import { FiPlus, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";
import { CreateBoardModal } from "@/components/board/CreateBoardModal";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USER_BOARDS, CREATE_BOARD } from "@/graphql/board";
import { Board } from "@/types/board";

interface CreateBoardInput {
  title: string;
  description?: string;
}

interface CreateBoardResult {
  createBoard: Board;
}

export default function BoardsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const toast = useToast();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");

  // GraphQL query to fetch all boards
  const {
    data,
    loading: isLoading,
    error: queryError,
    refetch,
  } = useQuery<{ boards: Board[] }>(GET_USER_BOARDS);

  // GraphQL mutation to create a board with proper cache update
  const [createBoardMutation, { loading: isCreating }] = useMutation<
    CreateBoardResult,
    { input: CreateBoardInput }
  >(CREATE_BOARD, {
    update(cache, { data }) {
      if (!data) return;

      try {
        // Read the current cache
        const existingData = cache.readQuery<{ boards: Board[] }>({
          query: GET_USER_BOARDS,
        });

        // Write back to the cache with the new board included
        cache.writeQuery({
          query: GET_USER_BOARDS,
          data: {
            boards: existingData?.boards
              ? [...existingData.boards, data.createBoard]
              : [data.createBoard],
          },
        });
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
          input: boardData,
        },
      });
      // The onCompleted and onError callbacks will handle the rest
    } catch (err) {
      // This catch is for unexpected errors that might not be caught by onError
      console.error("Unexpected error creating board:", err);
    }
  };

  const renderBoardList = () => {
    if (boards.length === 0) {
      return (
        <Box
          textAlign="center"
          p={10}
          borderRadius="md"
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Text fontSize="lg" mb={4}>
            You don&apos;t have any boards yet
          </Text>
          <Text mb={6} color="gray.500">
            Create your first board to get started with your projects
          </Text>
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

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
        {boards.map((board) => (
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
        ))}

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
    );
  };

  const renderContent = () => {
    if (isLoading) {
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
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={() => setIsCreateModalOpen(true)}
          width={{ base: "full", sm: "auto" }}
        >
          Create Board
        </Button>
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
