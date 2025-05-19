// components/dashboard/TaskSummary.tsx
import React, { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_TASK_STATS } from "@/graphql/dashboard";
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Skeleton,
} from "@chakra-ui/react";

export default function TaskSummary() {
  // Use refetchOnMount to always get fresh data when the component mounts
  const { data, loading, refetch } = useQuery(GET_TASK_STATS, {
    fetchPolicy: 'network-only', // Don't use cache, always get fresh data
    nextFetchPolicy: 'cache-first' // After the first fetch, can use cache for subsequent renders
  });

  // Force refetch when component mounts to ensure fresh data
  useEffect(() => {
    refetch();
    // Set up an interval to refetch data every 10 seconds
    const intervalId = setInterval(() => {
      refetch();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [refetch]);
  
  // Additional effect for manual refetch and logging on mount
  useEffect(() => {
    if (!loading && data?.taskStats) {
      console.log("Triggering an immediate refetch of task stats...");
      refetch().then(result => {
        console.log("Manual refetch result:", result.data?.taskStats);
      });
    }
  }, [loading, data, refetch]);

  if (loading) {
    return <Skeleton height="100px" />;
  }
  
  // Get the stats directly from GraphQL without any transformation
  const stats = data?.taskStats || {
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
  };
  
  // Enhanced logging with timestamp for tracking changes
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Raw task stats from server:`, data?.taskStats);
  console.log(`Task count breakdown - Total: ${stats.total}, Todo: ${stats.todo}, In Progress: ${stats.inProgress}, Completed: ${stats.completed}`);


  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
      <StatGroup>
        <Stat>
          <StatLabel>Total Tasks</StatLabel>
          <StatNumber>{stats.total}</StatNumber>
        </Stat>

        <Stat>
          <StatLabel>To Do</StatLabel>
          <StatNumber>{stats.todo}</StatNumber>
        </Stat>

        <Stat>
          <StatLabel>In Progress</StatLabel>
          <StatNumber>{stats.inProgress}</StatNumber>
        </Stat>

        <Stat>
          <StatLabel>Completed</StatLabel>
          <StatNumber>{stats.completed}</StatNumber>
        </Stat>
      </StatGroup>
    </Box>
  );
}