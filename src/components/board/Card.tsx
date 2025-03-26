// src/components/board/Card.tsx
import { useState } from "react";
import {
  Box,
  Text,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Textarea,
  useToast,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiEdit2 } from "react-icons/fi";
import { Draggable } from "react-beautiful-dnd";
import { updateBoard } from "@/services/boardService";
import { Board, Card as CardType } from "@/types/board";

interface CardProps {
  card: CardType;
  index: number;
  boardId: string;
  columnId: string;
  onBoardChange: (board: Board) => void;
}

export default function Card({
  card,
  index,
  boardId,
  columnId,
  onBoardChange,
}: CardProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.700");
  const cardBorder = useColorModeValue("gray.200", "gray.600");

  const handleSaveCard = async () => {
    try {
      // Find the column and update the card
      const updatedBoard = await updateBoard(boardId, {
        columns: [
          {
            id: columnId,
            cards: [
              {
                ...card,
                title,
                description,
              },
            ],
          },
        ],
      });

      onBoardChange(updatedBoard);
      onClose();

      toast({
        title: "Card updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to update card:", error);
      toast({
        title: "Error",
        description: "Failed to update card",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            mb={2}
            p={3}
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="md"
            boxShadow={snapshot.isDragging ? "md" : "sm"}
            position="relative"
            _hover={{ boxShadow: "md" }}
          >
            <Text fontWeight="medium">{card.title}</Text>

            {card.description && (
              <Text fontSize="sm" color="gray.500" mt={1} noOfLines={2}>
                {card.description}
              </Text>
            )}

            <Box position="absolute" top={2} right={2}>
              <IconButton
                aria-label="Edit card"
                icon={<FiEdit2 />}
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
              />
            </Box>
          </Box>
        )}
      </Draggable>

      {/* Card Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Card</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={4}>
              <Box>
                <Text mb={1} fontWeight="medium">
                  Title
                </Text>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Card title"
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium">
                  Description
                </Text>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                  rows={4}
                />
              </Box>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveCard}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
