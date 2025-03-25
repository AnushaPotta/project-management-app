// src/app/boards/[boardId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Box } from "@chakra-ui/react";
import { DragDropContext } from "react-beautiful-dnd";
import Column from "@/components/board/Column";
import CardModal from "@/components/board/CardModal";
import AddCardModal from "@/components/board/AddCardModal";
import AddColumnModal from "@/components/board/AddColumnModal";
import { fetchBoard } from "@/services/boardService"; // Create this service

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);

  useEffect(() => {
    // Load board data
    if (boardId) {
      fetchBoard(boardId).then(setBoard);
    }
  }, [boardId]);

  const handleDragEnd = (result) => {
    // Handle drag and drop
  };

  if (!board) return <Box>Loading...</Box>;

  return (
    <Box pt={4}>
      <Box display="flex" overflowX="auto" p={2} gap={4}>
        {board.columns.map((column, index) => (
          <Column
            key={column.id}
            column={column}
            index={index}
            onAddCard={() => {
              setSelectedColumnId(column.id);
              setIsAddCardModalOpen(true);
            }}
            onOpenCard={(cardId) => {
              setSelectedCardId(cardId);
              setIsCardModalOpen(true);
            }}
          />
        ))}
      </Box>

      {/* Modals */}
      <AddColumnModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        boardId={boardId}
      />

      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        columnId={selectedColumnId}
      />

      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        cardId={selectedCardId}
      />
    </Box>
  );
}
