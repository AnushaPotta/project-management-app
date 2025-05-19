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
    <Box p={{ base: 3, md: 5 }} shadow="md" borderWidth="1px" borderRadius="md">
      <StatGroup 
        flexWrap="wrap" 
        textAlign="center"
        justifyContent={{ base: "space-around", md: "space-between" }}
      >
        <Stat 
          minWidth={{ base: "40%", md: "auto" }} 
          mb={{ base: 4, md: 0 }}
          px={{ base: 1, md: 3 }}
        >
          <StatLabel fontSize={{ base: "xs", md: "sm" }}>Total Tasks</StatLabel>
          <StatNumber fontSize={{ base: "xl", md: "2xl" }}>{stats.total}</StatNumber>
        </Stat>

        <Stat 
          minWidth={{ base: "40%", md: "auto" }} 
          mb={{ base: 4, md: 0 }}
          px={{ base: 1, md: 3 }}
        >
          <StatLabel fontSize={{ base: "xs", md: "sm" }}>To Do</StatLabel>
          <StatNumber fontSize={{ base: "xl", md: "2xl" }}>{stats.todo}</StatNumber>
        </Stat>

        <Stat 
          minWidth={{ base: "40%", md: "auto" }} 
          px={{ base: 1, md: 3 }}
        >
          <StatLabel fontSize={{ base: "xs", md: "sm" }}>In Progress</StatLabel>
          <StatNumber fontSize={{ base: "xl", md: "2xl" }}>{stats.inProgress}</StatNumber>
        </Stat>

        <Stat 
          minWidth={{ base: "40%", md: "auto" }} 
          px={{ base: 1, md: 3 }}
        >
          <StatLabel fontSize={{ base: "xs", md: "sm" }}>Completed</StatLabel>
          <StatNumber fontSize={{ base: "xl", md: "2xl" }}>{stats.completed}</StatNumber>
        </Stat>
      </StatGroup>
    </Box>
  );
}