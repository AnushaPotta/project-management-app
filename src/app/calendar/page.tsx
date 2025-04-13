// src/app/calendar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Box, Heading, useToast } from "@chakra-ui/react";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/ui/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BoardProvider } from "@/contexts/board-context";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CalendarView from "@/components/calendar/CalendarView";

// GraphQL query to get cards with due dates
const GET_CARDS_WITH_DUE_DATES = gql`
  query GetCardsWithDueDates {
    upcomingDeadlines(days: 60) {
      id
      title
      dueDate
      boardId
      boardTitle
      columnId
      columnTitle
    }
  }
`;

function CalendarContent() {
  const toast = useToast();
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before making GraphQL requests
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, loading, error } = useQuery(GET_CARDS_WITH_DUE_DATES, {
    skip: !user || !isClient,
    onError: (error) => {
      toast({
        title: "Error loading calendar data",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    },
  });

  if (!isClient || loading) return <LoadingState />;

  if (error) {
    return (
      <Box p={6} borderWidth="1px" borderRadius="lg" bg="red.50">
        <Heading size="md" color="red.500">
          Error Loading Calendar Data
        </Heading>
        <Box mt={4}>{error.message}</Box>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Calendar
      </Heading>
      
      <CalendarView tasks={data?.upcomingDeadlines || []} />
    </Box>
  );
}

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <BoardProvider>
          <DashboardLayout>
            <CalendarContent />
          </DashboardLayout>
        </BoardProvider>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}