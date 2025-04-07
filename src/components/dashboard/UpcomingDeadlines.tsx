// components/dashboard/UpcomingDeadlines.tsx
import { useQuery } from "@apollo/client";
import {
  Box,
  Heading,
  VStack,
  Text,
  Flex,
  Badge,
  Spinner,
  Icon,
  Progress,
} from "@chakra-ui/react";
import { GET_UPCOMING_DEADLINES } from "@/graphql/dashboard"; // Adjust path if needed
import { format, isPast, differenceInDays } from "date-fns";
import { FiClock, FiAlertCircle } from "react-icons/fi";

export default function UpcomingDeadlines() {
  const { data, loading, error } = useQuery(GET_UPCOMING_DEADLINES, {
    variables: { days: 14 }, // Get deadlines for next 14 days
  });

  // Loading state
  if (loading) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
        <Heading size="md" mb={4}>
          Upcoming Deadlines
        </Heading>
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
        <Heading size="md" mb={4}>
          Upcoming Deadlines
        </Heading>
        <Flex direction="column" align="center" justify="center" h="200px">
          <Icon as={FiAlertCircle} w={10} h={10} color="red.500" mb={3} />
          <Text>Failed to load upcoming deadlines</Text>
        </Flex>
      </Box>
    );
  }

  // Empty state
  if (!data?.upcomingDeadlines || data.upcomingDeadlines.length === 0) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
        <Heading size="md" mb={4}>
          Upcoming Deadlines
        </Heading>
        <Flex direction="column" align="center" justify="center" h="200px">
          <Text color="gray.500">No upcoming deadlines</Text>
        </Flex>
      </Box>
    );
  }

  // Choose color based on deadline proximity
  const getDeadlineColor = (dueDate) => {
    const date = new Date(dueDate);
    if (isPast(date)) return "red";

    const daysLeft = differenceInDays(date, new Date());
    if (daysLeft <= 1) return "red";
    if (daysLeft <= 3) return "orange";
    if (daysLeft <= 7) return "yellow";
    return "green";
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <Heading size="md" mb={4}>
        Upcoming Deadlines
      </Heading>
      <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
        {data.upcomingDeadlines.map((task) => {
          const deadlineColor = getDeadlineColor(task.dueDate);
          const daysLeft = differenceInDays(new Date(task.dueDate), new Date());
          const isPastDue = isPast(new Date(task.dueDate));

          return (
            <Box key={task.id} p={3} borderWidth="1px" borderRadius="md">
              <Flex justify="space-between" align="center">
                <Text fontWeight="medium">{task.title}</Text>
                <Badge colorScheme={deadlineColor}>
                  {format(new Date(task.dueDate), "MMM dd, yyyy")}
                </Badge>
              </Flex>

              <Flex align="center" mt={2}>
                <Icon
                  as={FiClock}
                  mr={2}
                  color={isPastDue ? "red.500" : "gray.500"}
                />
                <Text fontSize="sm" color={isPastDue ? "red.500" : "gray.600"}>
                  {isPastDue ? "Overdue" : `${daysLeft} days remaining`}
                </Text>
              </Flex>

              <Progress
                mt={2}
                size="sm"
                colorScheme={deadlineColor}
                value={isPastDue ? 100 : 100 - (daysLeft / 14) * 100}
                isIndeterminate={isPastDue}
              />

              <Flex mt={2} justify="space-between">
                <Badge colorScheme="blue">{task.boardTitle}</Badge>
                <Badge colorScheme="cyan">{task.columnTitle}</Badge>
              </Flex>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
