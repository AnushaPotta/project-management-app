// src/components/board/TaskCard.tsx
import { Box, Text, Badge, Flex } from "@chakra-ui/react";
import { forwardRef } from "react";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    assignee?: string;
  };
  onClick?: () => void;
}

const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, onClick, ...props }, ref) => {
    const priorityColor = {
      low: "green",
      medium: "yellow",
      high: "red",
    };

    return (
      <Box
        ref={ref}
        p={3}
        borderWidth="1px"
        borderRadius="md"
        bg="white"
        boxShadow="sm"
        mb={2}
        cursor="pointer"
        onClick={onClick}
        _hover={{ boxShadow: "md" }}
        {...props}
      >
        <Text fontWeight="medium" mb={1}>
          {task.title}
        </Text>

        {task.description && (
          <Text fontSize="sm" color="gray.600" noOfLines={2} mb={2}>
            {task.description}
          </Text>
        )}

        <Flex justifyContent="space-between" alignItems="center">
          {task.priority && (
            <Badge colorScheme={priorityColor[task.priority] || "gray"}>
              {task.priority}
            </Badge>
          )}

          {task.assignee && (
            <Text fontSize="xs" color="gray.500">
              {task.assignee}
            </Text>
          )}
        </Flex>
      </Box>
    );
  }
);

TaskCard.displayName = "TaskCard";

export default TaskCard;
