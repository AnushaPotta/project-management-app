// pages/activities.tsx

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
} from "@chakra-ui/react";
import { GET_RECENT_ACTIVITY } from "@/graphql/dashboard";
import { formatDistanceToNow } from "date-fns";
import { FiActivity, FiAlertCircle, FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActivitiesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data, loading, error, fetchMore } = useQuery(GET_RECENT_ACTIVITY, {
    variables: { limit: PAGE_SIZE },
  });

  const loadMore = () => {
    fetchMore({
      variables: {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
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
      ) : (
        <>
          <VStack spacing={4} align="stretch">
            {data?.recentActivity.map((activity) => (
              <Box
                key={activity.id}
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
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
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

          {data?.recentActivity?.length > 0 && (
            <Flex justify="center" mt={8}>
              <Button
                onClick={loadMore}
                isLoading={loading}
                loadingText="Loading"
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
