// src/components/board/BoardList.tsx
import { SimpleGrid, Box, Button, Text } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { BoardCard } from "./BoardCard";
import CreateBoardModal from "./CreateBoardModal";
import { useState } from "react";

interface Board {
  id: string;
  title: string;
  background: string;
  isStarred?: boolean;
  members: number;
}

interface BoardListProps {
  boards: Board[];
  onBoardClick: (boardId: string) => void;
  onCreateBoard: (boardData: Omit<Board, "id">) => void;
}

export function BoardList({
  boards,
  onBoardClick,
  onCreateBoard,
}: BoardListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <Box p={6}>
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Your Boards
      </Text>

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            onClick={() => onBoardClick(board.id)}
          />
        ))}

        <Button
          h="150px"
          onClick={() => setIsCreateModalOpen(true)}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <FiPlus size={24} />
          <Text>Create New Board</Text>
        </Button>
      </SimpleGrid>

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateBoard={onCreateBoard}
      />
    </Box>
  );
}
