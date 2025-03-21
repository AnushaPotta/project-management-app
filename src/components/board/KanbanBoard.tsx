// src/components/board/KanbanBoard.tsx
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Box, Flex, Heading } from "@chakra-ui/react";
import TaskCard from "@/components/board/TaskCard";
import AddTaskButton from "@/components/board/AddTaskButton";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

interface BoardData {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
}

export default function KanbanBoard({
  initialData,
}: {
  initialData: BoardData;
}) {
  const [boardData, setBoardData] = useState(initialData);

  const onDragEnd = (result) => {
    // Handle drag and drop logic here
    // Update state based on where the task was dropped
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Flex gap={4} overflowX="auto" p={4}>
        {boardData.columnOrder.map((columnId) => {
          const column = boardData.columns[columnId];
          const tasks = column.taskIds.map((taskId) => boardData.tasks[taskId]);

          return (
            <Box
              key={column.id}
              bg="gray.100"
              borderRadius="md"
              p={2}
              minW="250px"
            >
              <Heading size="md" mb={2} p={2}>
                {column.title}
              </Heading>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    minH="100px"
                  >
                    {tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <TaskCard
                            task={task}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <AddTaskButton
                      columnId={column.id}
                      onAddTask={/* add task handler */}
                    />
                  </Box>
                )}
              </Droppable>
            </Box>
          );
        })}
      </Flex>
    </DragDropContext>
  );
}
