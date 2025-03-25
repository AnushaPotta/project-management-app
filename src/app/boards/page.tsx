// src/app/boards/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Box, Button, Heading } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { BoardList } from "@/components/board/BoardList";
import { CreateBoardModal } from "@/components/board/CreateBoardModal";
import { fetchAllBoards } from "@/services/boardService";

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const loadBoards = async () => {
      const boardsData = await fetchAllBoards();
      setBoards(boardsData);
    };
    loadBoards();
  }, []);

  return (
    <Box p={6}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={6}
      >
        <Heading size="lg">Your Boards</Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Board
        </Button>
      </Box>

      <BoardList boards={boards} />

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBoardCreated={(newBoard) => {
          setBoards([...boards, newBoard]);
        }}
      />
    </Box>
  );
}
