// components/dashboard/TaskSummary.tsx
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
  const { data, loading } = useQuery(GET_TASK_STATS);

  if (loading) {
    return <Skeleton height="100px" />;
  }

  const stats = data?.taskStats || {
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
  };

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