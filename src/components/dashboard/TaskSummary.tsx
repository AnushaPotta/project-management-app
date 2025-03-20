import {
  Box,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";

// Define the Task interface
interface Task {
  id: string | number;
  title: string;
  status: string;
  // Add other task properties as needed
}

// Update the component props to use the Task interface
interface TaskSummaryProps {
  tasks?: Task[];
}

export default function TaskSummary({ tasks = [] }: TaskSummaryProps) {
  const bgColor = useColorModeValue("white", "gray.700");

  // Calculate stats (replace with actual data)
  const totalTasks = tasks.length || 15;
  const completedTasks = tasks.filter((t) => t?.status === "done")?.length || 7;
  const inProgressTasks =
    tasks.filter((t) => t?.status === "in-progress")?.length || 5;
  const upcomingTasks = tasks.filter((t) => t?.status === "to-do")?.length || 3;

  return (
    <Box p={5} borderRadius="lg" bg={bgColor} boxShadow="sm" borderWidth="1px">
      <Heading size="md" mb={4}>
        Task Summary
      </Heading>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Stat>
          <StatLabel>Total Tasks</StatLabel>
          <StatNumber>{totalTasks}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Completed</StatLabel>
          <StatNumber>{completedTasks}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>In Progress</StatLabel>
          <StatNumber>{inProgressTasks}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Upcoming</StatLabel>
          <StatNumber>{upcomingTasks}</StatNumber>
        </Stat>
      </SimpleGrid>
    </Box>
  );
}
