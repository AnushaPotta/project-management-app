// src/components/board/BoardLayout.tsx
import { Box } from "@chakra-ui/react";
import { BoardMenu } from "./BoardMenu";

interface BoardLayoutProps {
  children: React.ReactNode;
  onArchive?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function BoardLayout({
  children,
  onArchive,
  onDelete,
  onEdit,
}: BoardLayoutProps) {
  return (
    <Box position="relative" minH="100vh">
      <Box position="absolute" top={4} right={4} zIndex={10}>
        <BoardMenu onArchive={onArchive} onDelete={onDelete} onEdit={onEdit} />
      </Box>
      {children}
    </Box>
  );
}
