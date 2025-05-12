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
  // Use cache-first to reduce Firebase calls but still get updated data when needed
  const { data, loading, refetch } = useQuery(GET_TASK_STATS, {
    fetchPolicy: 'cache-and-network', // Use cache but also update in background
    nextFetchPolicy: 'cache-first', // Use cache for subsequent renders
    // Increase the standby time before refetching to reduce Firebase calls
    pollInterval: 300000, // 5 minutes (300000ms)
  });

  // Only refetch when component mounts, with a reduced frequency
  useEffect(() => {
    // No need to refetch immediately as cache-and-network will do that
    
    // Set up a less frequent polling interval to reduce Firebase calls
    // This is a backup in case the Apollo pollInterval doesn't work as expected
    const intervalId = setInterval(() => {
      console.log("Scheduled task stats refresh");
      refetch().catch(err => console.error("Error refreshing task stats:", err));
    }, 300000); // 5 minutes (300000ms)
    
    return () => clearInterval(intervalId);
  }, [refetch]);
  
  // Remove the additional immediate refetch effect that was causing duplicate calls

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