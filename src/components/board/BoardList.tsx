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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Collapse,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { FiStar, FiArchive, FiFolder } from "react-icons/fi";
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
  showArchived?: boolean;
}

export function BoardList({
  boards,
  onBoardClick,
  onCreateBoard,
  isCreating,
  error,
  showArchived = false,
}: BoardListProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Filter boards by archived status
  const activeBoards = boards.filter(board => !board.isArchived);
  const archivedBoards = boards.filter(board => board.isArchived);

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

      <Tabs variant="soft-rounded" colorScheme="blue">
        <TabList mb={4}>
          <Tab 
            fontWeight="medium"
            color="gray.700" 
            _selected={{ color: "blue.600", bg: "blue.50" }}>
            <Icon as={FiFolder} mr={2} /> Active Boards
          </Tab>
          <Tab 
            fontWeight="medium"
            color="gray.700"
            _selected={{ color: "blue.600", bg: "blue.50" }}>
            <Icon as={FiArchive} mr={2} /> Archived
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            {activeBoards.length === 0 ? (
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
          {activeBoards.map((board) => (
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
          </TabPanel>
          <TabPanel px={0}>
            {archivedBoards.length === 0 ? (
              <Box p={8} textAlign="center" borderWidth="1px" borderRadius="lg" bg="white">
                <Text color="gray.600" mb={4}>
                  You don&apos;t have any archived boards
                </Text>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {archivedBoards.map((board) => (
                  <Box
                    key={board.id}
                    p={6}
                    borderWidth="1px"
                    borderRadius="lg"
                    bg="gray.50"
                    cursor="pointer"
                    position="relative"
                    _hover={{
                      transform: "translateY(-2px)",
                      shadow: "md",
                      borderColor: "gray.300",
                    }}
                    transition="all 0.2s"
                    onClick={() => onBoardClick(board)}
                  >
                    <Badge colorScheme="gray" position="absolute" top={2} right={2}>
                      Archived
                    </Badge>
                    <Text fontSize="xl" fontWeight="bold" mb={2}>
                      {board.title}
                    </Text>
                    {board.description && (
                      <Text color="gray.600" noOfLines={2} mb={3}>
                        {board.description}
                      </Text>
                    )}
                    <Box>
                      <Badge colorScheme="gray">
                        {board.columns?.length || 0} columns
                      </Badge>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      <CreateBoardModal
        isOpen={isOpen}
        onClose={onClose}
        onCreateBoard={onCreateBoard}
        isCreating={isCreating}
      />
    </VStack>
  );
}
