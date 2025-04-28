// components/dashboard/UpcomingDeadlines.tsx
import { useQuery, useMutation } from "@apollo/client";
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
  Button,
  Divider,
} from "@chakra-ui/react";
import { GET_UPCOMING_DEADLINES } from "@/graphql/dashboard"; // Adjust path if needed
import { format, isPast, differenceInDays } from "date-fns";
import {
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiChevronRight,
} from "react-icons/fi";
import { MARK_TASK_COMPLETE } from "@/graphql/dashboard";
import { useRouter } from "next/navigation";

export default function UpcomingDeadlines() {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_UPCOMING_DEADLINES, {
    variables: { days: 30 }, // Get deadlines for next 14 days
    onCompleted: (data) => console.log("Query completed:", data),
    onError: (error) => console.error("Query error:", error),
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

  const handleViewAllClick = () => {
    router.push("/deadlines"); // Navigate to a dedicated deadlines page
  };
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
  const getDeadlineColor = (dueDate: Date) => {
    try {
      if (isPast(dueDate)) return "red";

      const daysLeft = differenceInDays(dueDate, new Date());
      if (daysLeft <= 1) return "red";
      if (daysLeft <= 3) return "orange";
      if (daysLeft <= 7) return "yellow";
      return "green";
    } catch (e) {
      console.error('Error determining deadline color:', e);
      return "gray"; // Neutral fallback color
    }
  };

  console.log("UpcomingDeadlines render:", { loading, error, data });

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <Heading size="md" mb={4}>
        Upcoming Deadlines
      </Heading>
      <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
        {data.upcomingDeadlines.map((task) => {
          // Safely parse the due date with a cleaner implementation
          let dueDate;
          try {
            const timestamp = task.dueDate;

            // 🛑 Early return if timestamp is missing or empty
            if (
              !timestamp || 
              (typeof timestamp === 'object' && Object.keys(timestamp).length === 0)
            ) {
              console.warn('Empty or missing due date:', timestamp);
              dueDate = new Date(); // Default to current date
            }
            else if (typeof timestamp === 'object' && timestamp._seconds) {
              dueDate = new Date(timestamp._seconds * 1000);
            } 
            else if (typeof timestamp === 'object' && timestamp.seconds) {
              dueDate = new Date(timestamp.seconds * 1000);
            } 
            else if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
              dueDate = timestamp.toDate();
            } 
            else if (typeof timestamp === 'number') {
              dueDate = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
            } 
            else if (typeof timestamp === 'string') {
              dueDate = new Date(timestamp);
            } 
            else if (timestamp instanceof Date) {
              dueDate = timestamp;
            } 
            else {
              console.warn('Unexpected due date format:', timestamp);
              dueDate = new Date(); // Default to current date if format is unknown
            }

            // 🛡️ Validate the created date
            if (isNaN(dueDate.getTime())) {
              console.error('Invalid date after parsing:', dueDate);
              dueDate = new Date(); // Fall back to current date
            }
          } catch (e) {
            console.error('Error parsing due date:', e);
            dueDate = new Date(); // Fallback to current date if parsing fails
          }
          
          const deadlineColor = getDeadlineColor(dueDate);
          const daysLeft = differenceInDays(dueDate, new Date());
          const isPastDue = isPast(dueDate);

          return (
            // Add onClick handler to make the card clickable
            <Box
              key={task.id}
              p={3}
              borderWidth="1px"
              borderRadius="md"
              onClick={() => handleTaskClick(task.id, task.boardId)}
              cursor="pointer"
              _hover={{ bg: "gray.50" }}
            >
              <Flex justify="space-between" align="center">
                <Text fontWeight="medium">{task.title}</Text>
                <Badge colorScheme={deadlineColor}>
                  {(() => {
                    try {
                      return format(dueDate, "MMM dd, yyyy");
                    } catch (e) {
                      console.error('Error formatting date for badge:', e);
                      return 'Date unknown';
                    }
                  })()}
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

              {/* Add this section with Flex layout to include the Complete button */}
              <Flex mt={2} justify="space-between" align="center">
                <Flex>
                  <Badge colorScheme="blue" mr={2}>
                    {task.boardTitle}
                  </Badge>
                  <Badge colorScheme="cyan">{task.columnTitle}</Badge>
                </Flex>

                {/* Add the Complete button here */}
                <Button
                  size="xs"
                  colorScheme="green"
                  leftIcon={<FiCheck />}
                  isLoading={markingComplete}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click when button is clicked
                    markTaskComplete({
                      variables: { id: task.id },
                    });
                  }}
                >
                  Complete
                </Button>
              </Flex>
            </Box>
          );
        })}
      </VStack>

      {data?.upcomingDeadlines?.length > 0 && (
        <>
          <Divider my={4} />
          <Box textAlign="center">
            <Button
              rightIcon={<FiChevronRight />}
              variant="ghost"
              size="sm"
              onClick={handleViewAllClick}
            >
              View All Deadlines
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
