// src/app/team/page.tsx
"use client";

import { useState } from "react";
import { Box, Heading, useToast } from "@chakra-ui/react";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/ui/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TeamView from "@/components/team/TeamView";

// GraphQL query to get user's teams and boards they're a member of
const GET_USER_TEAMS = gql`
  query GetUserTeams {
    boards {
      id
      title
      members {
        id
        name
        email
        avatar
        role
      }
    }
  }
`;

export default function TeamPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  // Fetch team data
  const { loading, error, data } = useQuery(GET_USER_TEAMS, {
    skip: !user,
    onError: (error) => {
      toast({
        title: "Error loading teams",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  // Process team data
  const teamMembers = data?.boards.reduce((members, board) => {
    // Add unique members from all boards
    board.members.forEach(member => {
      if (!members.some(m => m.id === member.id)) {
        members.push(member);
      }
    });
    return members;
  }, []) || [];

  const boardsWithMembers = data?.boards || [];

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <DashboardLayout>
          <Box p={5}>
            <Heading mb={6}>Team Management</Heading>
            
            {loading ? (
              <LoadingState />
            ) : error ? (
              <Box>Error loading team data. Please try again.</Box>
            ) : (
              <TeamView teamMembers={teamMembers} boardsWithMembers={boardsWithMembers} />
            )}
          </Box>
        </DashboardLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}