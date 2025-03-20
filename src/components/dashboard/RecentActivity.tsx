import {
  Box,
  Heading,
  VStack,
  Text,
  Flex,
  Avatar,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiClock } from "react-icons/fi";

// Sample activity item component
const ActivityItem = ({ user, action, target, time }) => {
  return (
    <Flex py={2} alignItems="center">
      <Avatar size="sm" name={user.name} src={user.avatar} mr={3} />
      <Box flex="1">
        <Text fontSize="sm">
          <Text as="span" fontWeight="bold">
            {user.name}
          </Text>{" "}
          {action}{" "}
          <Text as="span" fontWeight="medium">
            {target}
          </Text>
        </Text>
        <Flex alignItems="center" mt={1} color="gray.500">
          <FiClock size={12} />
          <Text fontSize="xs" ml={1}>
            {time}
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
};

export default function RecentActivity() {
  const bgColor = useColorModeValue("white", "gray.700");

  // Sample data - replace with actual data
  const activities = [
    {
      id: 1,
      user: { name: "Jane Cooper", avatar: "" },
      action: "completed task",
      target: "Update homepage design",
      time: "10 minutes ago",
    },
    {
      id: 2,
      user: { name: "Alex Morgan", avatar: "" },
      action: "commented on",
      target: "API integration issue",
      time: "1 hour ago",
    },
    {
      id: 3,
      user: { name: "Taylor Swift", avatar: "" },
      action: "created a new board",
      target: "Marketing Campaign 2025",
      time: "3 hours ago",
    },
    {
      id: 4,
      user: { name: "Robert Chen", avatar: "" },
      action: "moved task",
      target: "Update documentation",
      time: "Yesterday at 4:30 PM",
    },
  ];

  return (
    <Box
      p={5}
      borderRadius="lg"
      bg={bgColor}
      boxShadow="sm"
      borderWidth="1px"
      h="100%"
    >
      <Heading size="md" mb={4}>
        Recent Activity
      </Heading>
      <VStack
        spacing={3}
        align="stretch"
        divider={<Box borderBottomWidth="1px" />}
      >
        {activities.map((activity) => (
          <ActivityItem key={activity.id} {...activity} />
        ))}
      </VStack>
    </Box>
  );
}
