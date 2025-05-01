// src/app/activities/page.tsx
"use client";

import { useQuery } from "@apollo/client";
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
  Divider,
} from "@chakra-ui/react";
import { GET_RECENT_ACTIVITY } from "@/graphql/dashboard";
import { formatDistanceToNow } from "date-fns";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

export default function ActivitiesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data, loading, error, fetchMore } = useQuery(GET_RECENT_ACTIVITY, {
    variables: { limit: PAGE_SIZE, offset: 0 },
  });

  // Create a unique list of activities by ID to prevent duplicate rendering
  const uniqueActivities = useMemo(() => {
    if (!data?.recentActivity) return [];

    // Use Map to preserve order but eliminate duplicates
    const uniqueMap = new Map();
    data.recentActivity.forEach((activity) => {
      // Only keep the first occurrence of each ID
      if (!uniqueMap.has(activity.id)) {
        uniqueMap.set(activity.id, activity);
      }
    });

    return Array.from(uniqueMap.values());
  }, [data?.recentActivity]);

  const loadMore = () => {
    if (uniqueActivities.length === 0) return;

    const nextOffset = page * PAGE_SIZE;
    
    fetchMore({
      variables: {
        limit: PAGE_SIZE,
        offset: nextOffset,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
          recentActivity: [
            ...prev.recentActivity,
            ...fetchMoreResult.recentActivity,
          ],
        };
      },
    });
    setPage(page + 1);
  };

  return (
    <Container maxW="container.lg" py={8}>
      <Flex mb={6} align="center">
        <Button
          leftIcon={<FiArrowLeft />}
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          mr={4}
        >
          Back
        </Button>
        <Heading>Activity History</Heading>
      </Flex>

      {loading && page === 1 ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Box textAlign="center" py={10}>
          <Icon as={FiAlertCircle} w={10} h={10} color="red.500" mb={3} />
          <Text>Failed to load activities</Text>
        </Box>
      ) : uniqueActivities.length === 0 ? (
        <Box textAlign="center" py={10} bg="gray.50" borderRadius="md">
          <Icon as={FiActivity} w={10} h={10} color="gray.400" mb={3} />
          <Text fontSize="lg">No activity found</Text>
        </Box>
      ) : (
        <>
          <VStack spacing={4} align="stretch">
            {uniqueActivities.map((activity, index) => (
              <Box
                key={`activity-${activity.id}-${index}`}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                shadow="sm"
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
                <Text mt={2}>{activity.description}</Text>
                <Flex mt={3}>
                  <Badge
                    colorScheme="blue"
                    mr={2}
                    cursor="pointer"
                    onClick={() => router.push(`/board/${activity.boardId}`)}
                    _hover={{ bg: "blue.100" }}
                  >
                    {activity.boardTitle}
                  </Badge>
                  <Badge colorScheme="purple">{activity.type}</Badge>
                </Flex>
              </Box>
            ))}
          </VStack>

          {uniqueActivities.length > 0 && (
            <Flex justify="center" mt={8}>
              <Button
                onClick={loadMore}
                isLoading={loading}
                loadingText="Loading"
                size="lg"
                w="200px"
                colorScheme="blue"
                isDisabled={
                  loading ||
                  (data?.recentActivity?.length < PAGE_SIZE && page > 1)
                }
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
