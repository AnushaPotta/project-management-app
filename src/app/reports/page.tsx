// src/app/reports/page.tsx
"use client";

import { useState } from "react";
import { Box, Heading, useToast } from "@chakra-ui/react";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/ui/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ReportsView from "@/components/reports/ReportsView";

// GraphQL queries for reports data
const GET_REPORTS_DATA = gql`
  query GetReportsData {
    taskStats {
      total
      todo
      inProgress
      completed
    }
    recentActivity(limit: 20) {
      id
      type
      boardId
      boardTitle
      userId
      userName
      timestamp
      description
    }
    upcomingDeadlines(days: 30) {
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

export default function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  // Fetch reports data
  const { loading, error, data } = useQuery(GET_REPORTS_DATA, {
    skip: !user,
    onError: (error) => {
      toast({
        title: "Error loading reports",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <DashboardLayout>
          <Box p={5}>
            <Heading mb={6}>Reports & Analytics</Heading>
            
            {loading ? (
              <LoadingState />
            ) : error ? (
              <Box>Error loading reports data. Please try again.</Box>
            ) : (
              <ReportsView 
                taskStats={data?.taskStats} 
                recentActivity={data?.recentActivity}
                upcomingDeadlines={data?.upcomingDeadlines}
              />
            )}
          </Box>
        </DashboardLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}