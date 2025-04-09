"use client";
import { useQuery, useMutation } from "@apollo/client";
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Flex,
  Badge,
  Spinner,
  Icon,
  Button,
  Progress,
  Select,
  HStack,
} from "@chakra-ui/react";
import {
  GET_UPCOMING_DEADLINES,
  MARK_TASK_COMPLETE,
} from "@/graphql/dashboard";
import { format, isPast, differenceInDays, addDays } from "date-fns";
import {
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiArrowLeft,
  FiCalendar,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeadlinesPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState(14); // Default: 2 weeks
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data, loading, error, fetchMore } = useQuery(GET_UPCOMING_DEADLINES, {
    variables: {
      days: timeframe,
      limit: PAGE_SIZE,
      offset: 0,
    },
  });

  const [markTaskComplete, { loading: markingComplete }] = useMutation(
    MARK_TASK_COMPLETE,
    {
      refetchQueries: ["GetUpcomingDeadlines", "GetTaskStats"],
    }
  );

  const handleTaskClick = (taskId, boardId) => {
    router.push(`/board/${boardId}?taskId=${taskId}`);
  };

  const loadMore = () => {
    fetchMore({
      variables: {
        days: timeframe,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          upcomingDeadlines: [
            ...prev.upcomingDeadlines,
            ...fetchMoreResult.upcomingDeadlines,
          ],
        };
      },
    });
    setPage(page + 1);
  };

  const getDeadlineColor = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);

    if (isPast(due)) return "red";

    const daysRemaining = differenceInDays(due, today);
    if (daysRemaining <= 2) return "red";
    if (daysRemaining <= 5) return "orange";
    if (daysRemaining <= 7) return "yellow";
    return "green";
  };

  return (
    <Container maxW="container.lg" py={8}>
      <Flex mb={6} align="center" justify="space-between">
        <Flex align="center">
          <Button
            leftIcon={<FiArrowLeft />}
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            mr={4}
          >
            Back
          </Button>
          <Heading>Upcoming Deadlines</Heading>
        </Flex>

        <HStack spacing={2}>
          <Icon as={FiCalendar} />
          <Select
            value={timeframe}
            onChange={(e) => {
              setTimeframe(Number(e.target.value));
              setPage(1);
            }}
            w="150px"
          >
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
            <option value={30}>Next 30 days</option>
            <option value={90}>Next 3 months</option>
          </Select>
        </HStack>
      </Flex>

      {loading && page === 1 ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Box textAlign="center" py={10}>
          <Icon as={FiAlertCircle} w={10} h={10} color="red.500" mb={3} />
          <Text>Failed to load deadlines</Text>
        </Box>
      ) : data?.upcomingDeadlines?.length === 0 ? (
        <Box textAlign="center" py={10} bg="gray.50" borderRadius="md">
          <Icon as={FiCheck} w={10} h={10} color="green.500" mb={3} />
          <Text fontSize="lg">
            No upcoming deadlines for the selected timeframe!
          </Text>
        </Box>
      ) : (
        <>
          <VStack spacing={4} align="stretch">
            {data?.upcomingDeadlines.map((task) => {
              const deadlineColor = getDeadlineColor(task.dueDate);
              const daysLeft = differenceInDays(
                new Date(task.dueDate),
                new Date()
              );
              const isPastDue = isPast(new Date(task.dueDate));

              return (
                <Box
                  key={task.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  shadow="sm"
                  cursor="pointer"
                  onClick={() => handleTaskClick(task.id, task.boardId)}
                  _hover={{ bg: "gray.50" }}
                >
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="lg">
                      {task.title}
                    </Text>
                    <Badge colorScheme={deadlineColor} fontSize="md" p={1}>
                      {format(new Date(task.dueDate), "MMM dd, yyyy")}
                    </Badge>
                  </Flex>

                  <Flex align="center" mt={3}>
                    <Icon
                      as={FiClock}
                      mr={2}
                      color={isPastDue ? "red.500" : "gray.500"}
                    />
                    <Text color={isPastDue ? "red.500" : "gray.600"}>
                      {isPastDue
                        ? `Overdue by ${Math.abs(daysLeft)} days`
                        : `${daysLeft} days remaining`}
                    </Text>
                  </Flex>

                  <Progress
                    mt={3}
                    size="sm"
                    colorScheme={deadlineColor}
                    value={isPastDue ? 100 : 100 - (daysLeft / timeframe) * 100}
                    isIndeterminate={isPastDue}
                  />

                  <Flex mt={4} justify="space-between" align="center">
                    <Flex>
                      <Badge colorScheme="blue" mr={2}>
                        {task.boardTitle}
                      </Badge>
                      <Badge colorScheme="cyan">{task.columnTitle}</Badge>
                    </Flex>

                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<FiCheck />}
                      isLoading={markingComplete}
                      onClick={(e) => {
                        e.stopPropagation();
                        markTaskComplete({
                          variables: { id: task.id },
                        });
                      }}
                    >
                      Mark Complete
                    </Button>
                  </Flex>
                </Box>
              );
            })}
          </VStack>

          {data?.upcomingDeadlines?.length >= PAGE_SIZE && (
            <Flex justify="center" mt={8}>
              <Button
                onClick={loadMore}
                isLoading={loading}
                loadingText="Loading"
                size="lg"
                w="200px"
              >
                Load More
              </Button>
            </Flex>
          )}
        </>
      )}
    </Container>
  );
}
