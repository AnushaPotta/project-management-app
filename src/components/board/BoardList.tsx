// src/components/board/BoardList.tsx
import {
  SimpleGrid,
  Box,
  Text,
  Button,
  useDisclosure,
  VStack,
  Heading,
  Badge,
  Icon,
  Flex,
  IconButton,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { FiStar } from "react-icons/fi";
import { CreateBoardModal } from "./CreateBoardModal";
import { Board } from "@/types/board";

interface BoardListProps {
  boards: Board[];
  onBoardClick: (board: Board) => void;
  onCreateBoard: (boardData: {
    title: string;
    description?: string;
  }) => Promise<void>;
  isCreating: boolean;
  error?: string;
}

export function BoardList({
  boards,
  onBoardClick,
  onCreateBoard,
  isCreating,
  error,
}: BoardListProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (error) {
    return (
      <Box
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        bg="red.50"
        borderColor="red.200"
      >
        <Heading size="md" mb={2} color="red.500">
          Error Loading Boards
        </Heading>
        <Text>{error}</Text>
        <Button
          mt={4}
          colorScheme="blue"
          onClick={() => onCreateBoard({ title: "My First Board" })}
        >
          Create New Board Instead
        </Button>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="lg">Your Boards</Heading>
        <Button
          onClick={onOpen}
          colorScheme="brand"
          size="md"
          leftIcon={<AddIcon />}
          isLoading={isCreating}
          loadingText="Creating..."
        >
          Create Board
        </Button>
      </Box>

      {boards.length === 0 ? (
        <Box
          p={8}
          textAlign="center"
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
        >
          <Text color="gray.600" mb={4}>
            You don&apos;t have any boards yet
          </Text>
          <Button
            onClick={onOpen}
            colorScheme="brand"
            size="lg"
            isLoading={isCreating}
          >
            Create Your First Board
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {boards.map((board) => (
            <Box
              key={board.id}
              p={6}
              borderWidth="1px"
              borderRadius="lg"
              bg="white"
              cursor="pointer"
              position="relative"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "md",
                borderColor: "brand.500",
              }}
              transition="all 0.2s"
              onClick={() => onBoardClick(board)}
            >
              {board.isStarred && (
                <Box
                  position="absolute"
                  top={2}
                  right={2}
                  color="yellow.400"
                  fontSize="lg"
                >
                  <Icon as={FiStar} fill="currentColor" />
                </Box>
              )}
              <Text fontSize="xl" fontWeight="bold" mb={2}>
                {board.title}
              </Text>
              {board.description && (
                <Text color="gray.600" noOfLines={2} mb={3}>
                  {board.description}
                </Text>
              )}
              <Box>
                <Badge colorScheme="brand">
                  {board.columns?.length || 0} columns
                </Badge>
                <Badge colorScheme="green" ml={2}>
                  {board.columns &&
                    board.columns.reduce(
                      (total, column) => total + column.cards.length,
                      0
                    )}{" "}
                  cards
                </Badge>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <CreateBoardModal
        isOpen={isOpen}
        onClose={onClose}
        onCreateBoard={onCreateBoard}
        isCreating={isCreating}
      />
    </VStack>
  );
}
