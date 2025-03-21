// src/components/board/AddTaskButton.tsx
import { Button } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";

interface AddTaskButtonProps {
  columnId: string;
  onAddTask: (columnId: string) => void;
}

export default function AddTaskButton({
  columnId,
  onAddTask,
}: AddTaskButtonProps) {
  return (
    <Button
      leftIcon={<FiPlus />}
      size="sm"
      variant="outline"
      colorScheme="blue"
      width="full"
      onClick={() => onAddTask(columnId)}
    >
      Add Task
    </Button>
  );
}
