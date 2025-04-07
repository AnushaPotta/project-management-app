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
} from "@chakra-ui/react";
import { GET_RECENT_ACTIVITY } from "@/graphql/dashboard"; // Adjust path if needed
import { formatDistanceToNow } from "date-fns";
import { FiActivity, FiAlertCircle } from "react-icons/fi";

export default function RecentActivity() {
  const { data, loading, error } = useQuery(GET_RECENT_ACTIVITY, {
    variables: { limit: 10 },
    pollInterval: 60000, // Optional: refresh every minute
  });

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
          <Box key={activity.id} p={3} borderWidth="1px" borderRadius="md">
            <Flex justify="space-between" align="center">
              <Flex align="center">
                <Icon as={FiActivity} mr={2} />
                <Text fontWeight="medium">{activity.userName}</Text>
              </Flex>
              <Text fontSize="sm" color="gray.500">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
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
    </Box>
  );
}
