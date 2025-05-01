// components/dashboard/RecentActivity.tsx
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
  Button,
  Divider,
} from "@chakra-ui/react";
import { GET_RECENT_ACTIVITY } from "@/graphql/dashboard"; // Adjust path if needed
import { formatDistanceToNow } from "date-fns";
import { FiActivity, FiAlertCircle, FiChevronRight } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function RecentActivity() {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_RECENT_ACTIVITY, {
    variables: { limit: 10 },
    pollInterval: 60000, // Optional: refresh every minute
  });

  const handleActivityClick = (activity) => {
    // Navigate to the related board
    router.push(`/board/${activity.boardId}`);
  };

  const handleViewAllClick = () => {
    router.push("/activities"); // Navigate to a dedicated activities page
  };

  // Loading state
  if (loading) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
        <Heading size="md" mb={4}>
          Recent Activity
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
          Recent Activity
        </Heading>
        <Flex direction="column" align="center" justify="center" h="200px">
          <Icon as={FiAlertCircle} w={10} h={10} color="red.500" mb={3} />
          <Text>Failed to load recent activities</Text>
        </Flex>
      </Box>
    );
  }

  // Empty state
  if (!data?.recentActivity || data.recentActivity.length === 0) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
        <Heading size="md" mb={4}>
          Recent Activity
        </Heading>
        <Flex direction="column" align="center" justify="center" h="200px">
          <Text color="gray.500">No recent activity to show</Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <Heading size="md" mb={4}>
        Recent Activity
      </Heading>
      <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
        {data.recentActivity.map((activity) => (
          <Box
            key={activity.id}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            cursor="pointer" // Add cursor pointer to indicate clickable
            onClick={() => handleActivityClick(activity)} // Add click handler
            _hover={{ bg: "gray.50" }} // Add hover effect
            transition="background 0.2s ease" // Smooth transition for hover
          >
            <Flex justify="space-between" align="center">
              <Flex align="center">
                <Icon as={FiActivity} mr={2} />
                <Text fontWeight="medium">{activity.userName}</Text>
              </Flex>
              <Text fontSize="sm" color="gray.500">
                {(() => {
                  try {
                    // Handle different timestamp formats
                    if (!activity.timestamp) return 'recently';
                    
                    let date;
                    if (typeof activity.timestamp === 'object' && activity.timestamp._seconds) {
                      // Firestore timestamp object
                      date = new Date(activity.timestamp._seconds * 1000);
                    } else if (typeof activity.timestamp === 'string') {
                      // ISO string
                      date = new Date(activity.timestamp);
                    } else {
                      return 'recently';
                    }
                    
                    // Verify it's a valid date
                    if (isNaN(date.getTime())) {
                      return 'recently';
                    }
                    
                    return formatDistanceToNow(date, { addSuffix: true });
                  } catch (err) {
                    return 'recently';
                  }
                })()}
              </Text>
            </Flex>
            <Text mt={1}>{activity.description}</Text>
            <Flex mt={2}>
              <Badge colorScheme="blue" mr={2}>
                {activity.boardTitle}
              </Badge>
              <Badge colorScheme="purple">{activity.type}</Badge>
            </Flex>
          </Box>
        ))}
      </VStack>

      {data?.recentActivity?.length > 0 && (
        <>
          <Divider my={4} />
          <Box textAlign="center">
            <Button
              rightIcon={<FiChevronRight />}
              variant="ghost"
              size="sm"
              onClick={handleViewAllClick}
            >
              View All Activities
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}