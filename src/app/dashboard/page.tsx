"use client";

import { useState, useEffect } from "react";
import {
  Container,
  useToast,
  Box,
  SimpleGrid,
  Heading,
  Text,
  Button,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USER_BOARDS, CREATE_BOARD } from "@/graphql/board";
import { useAuth } from "@/contexts/auth-context";
import { useBoard, BoardProvider } from "@/contexts/board-context";
import { LoadingState } from "@/components/ui/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Board } from "@/types/board";
import { ApolloError } from "@apollo/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { handleError } from "@/utils/error-handling";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TaskSummary from "@/components/dashboard/TaskSummary";
import RecentActivity from "@/components/dashboard/RecentActivity";
import UpcomingDeadlines from "@/components/dashboard/UpcomingDeadlines";
import { BoardList } from "@/components/board/BoardList";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/apollo-client";

interface CreateBoardInput {
  title: string;
  description?: string;
}

function DashboardContent() {
  const router = useRouter();
  const toast = useToast();
  const { setCurrentBoard } = useBoard();
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before making GraphQL requests
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Define handleCreateBoard function before it's used
  const handleCreateBoard = async (boardData: CreateBoardInput) => {
    try {
      const { data: createData } = await createBoard({
        variables: {
          title: boardData.title,
          description: boardData.description,
        },
        refetchQueries: [{ query: GET_USER_BOARDS }],
      });

      const newBoard = createData.createBoard;
      setCurrentBoard(newBoard);
      router.push(`/boards/${newBoard.id}`);

      toast({
        title: "Board created",
        description: "Successfully created new board",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      handleError(error, toast);
    }
  };

  const handleBoardClick = (board: Board) => {
    setCurrentBoard(board);
    router.push(`/boards/${board.id}`);
  };

  const { data, loading, error } = useQuery(GET_USER_BOARDS, {
    skip: !user || !isClient,
    onError: (error: ApolloError) => {
      toast({
        title: "Error loading boards",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    },
  });

  const [createBoard, { loading: isCreating }] = useMutation(CREATE_BOARD, {
    onError: (error: ApolloError) => {
      toast({
        title: "Error creating board",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    },
  });

  if (!isClient || loading) return <LoadingState />;

  // Handle error state explicitly without passing error to BoardList
  if (error && !data) {
    return (
      <Container maxW="container.xl" py={6}>
        <Box
          p={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="red.50"
          borderColor="red.200"
        >
          <Heading size="md" mb={2} color="red.500">
            Error Loading Boards
          </Heading>
          <Text>{error.message}</Text>
          <Button
            mt={4}
            colorScheme="blue"
            onClick={() => handleCreateBoard({ title: "My First Board" })}
            isLoading={isCreating}
          >
            Create New Board
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Dashboard
      </Heading>

      {/* Task summary widget */}
      <TaskSummary />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
        {/* Recent activity feed */}
        <RecentActivity />

        {/* Upcoming deadlines */}
        <UpcomingDeadlines />
      </SimpleGrid>

      {/* Board list */}
      <Box mt={8}>

        <BoardList
          boards={data?.boards || []}
          onBoardClick={handleBoardClick}
          onCreateBoard={handleCreateBoard}
          isCreating={isCreating}
        />
      </Box>
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <BoardProvider>
          <DashboardLayout>
            <DashboardContent />
          </DashboardLayout>
        </BoardProvider>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
