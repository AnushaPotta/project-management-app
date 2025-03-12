// src/components/board/BoardCard.tsx
import { Box, Text, Flex, IconButton } from "@chakra-ui/react";
import { FiStar } from "react-icons/fi";

interface BoardCardProps {
  board: {
    id: string;
    title: string;
    background: string;
    isStarred?: boolean;
    members: number;
  };
  onClick: () => void;
}

export function BoardCard({ board, onClick }: BoardCardProps) {
  return (
    <Box
      h="150px"
      borderRadius="lg"
      overflow="hidden"
      cursor="pointer"
      position="relative"
      onClick={onClick}
      backgroundImage={board.background}
      backgroundSize="cover"
      backgroundPosition="center"
      _hover={{ opacity: 0.9 }}
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0, 0, 0, 0.2)"
      />

      <Flex
        position="relative"
        direction="column"
        justify="space-between"
        h="100%"
        p={4}
        color="white"
      >
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="lg">
            {board.title}
          </Text>
          {board.isStarred && (
            <IconButton
              aria-label="Starred board"
              icon={<FiStar />}
              size="sm"
              colorScheme="yellow"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                // Handle star toggle
              }}
            />
          )}
        </Flex>

        <Text fontSize="sm">
          {board.members} {board.members === 1 ? "member" : "members"}
        </Text>
      </Flex>
    </Box>
  );
}
