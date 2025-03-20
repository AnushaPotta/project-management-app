import {
  Box,
  Heading,
  VStack,
  Text,
  Flex,
  Badge,
  Progress,
  useColorModeValue,
} from "@chakra-ui/react";

const DeadlineItem = ({ title, dueDate, progress, priority }) => {
  const getPriorityColor = (p) => {
    switch (p.toLowerCase()) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  const isOverdue = new Date(dueDate) < new Date();

  return (
    <Box p={3} borderRadius="md" borderWidth="1px">
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontWeight="medium">{title}</Text>
        <Badge colorScheme={getPriorityColor(priority)}>{priority}</Badge>
      </Flex>
      <Text fontSize="sm" color={isOverdue ? "red.500" : "gray.500"} mb={2}>
        Due: {new Date(dueDate).toLocaleDateString()}
        {isOverdue && " (Overdue)"}
      </Text>
      <Progress
        value={progress}
        colorScheme={progress === 100 ? "green" : "blue"}
        size="sm"
        borderRadius="full"
      />
    </Box>
  );
};

export default function UpcomingDeadlines() {
  const bgColor = useColorModeValue("white", "gray.700");

  // Sample data - replace with actual data
  const deadlines = [
    {
      id: 1,
      title: "Complete user authentication",
      dueDate: "2025-03-25",
      progress: 75,
      priority: "High",
    },
    {
      id: 2,
      title: "Design dashboard wireframes",
      dueDate: "2025-03-22",
      progress: 90,
      priority: "Medium",
    },
    {
      id: 3,
      title: "API documentation",
      dueDate: "2025-03-30",
      progress: 30,
      priority: "Low",
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
        Upcoming Deadlines
      </Heading>
      <VStack spacing={3} align="stretch">
        {deadlines.map((deadline) => (
          <DeadlineItem key={deadline.id} {...deadline} />
        ))}
      </VStack>
    </Box>
  );
}
