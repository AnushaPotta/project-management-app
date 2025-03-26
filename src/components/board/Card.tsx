"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import {
  Box,
  Text,
  Badge,
  useColorModeValue,
  Flex,
  useToast,
} from "@chakra-ui/react";
import { Draggable } from "@hello-pangea/dnd";
import { FiCalendar } from "react-icons/fi";
import CardModal from "./CardModal";

// GraphQL mutations
const DELETE_CARD = gql`
  mutation DeleteCard($cardId: ID!) {
    deleteCard(cardId: $cardId) {
      id
    }
  }
`;

// Available label colors with visual properties
const LABEL_COLORS = {
  red: { bg: "red.500", color: "white", name: "Red" },
  orange: { bg: "orange.400", color: "white", name: "Orange" },
  yellow: { bg: "yellow.400", color: "black", name: "Yellow" },
  green: { bg: "green.500", color: "white", name: "Green" },
  teal: { bg: "teal.500", color: "white", name: "Teal" },
  blue: { bg: "blue.500", color: "white", name: "Blue" },
  cyan: { bg: "cyan.500", color: "white", name: "Cyan" },
  purple: { bg: "purple.500", color: "white", name: "Purple" },
  pink: { bg: "pink.500", color: "white", name: "Pink" },
};

interface CardProps {
  card: {
    id: string;
    title: string;
    description?: string;
    labels?: string[];
    dueDate?: string;
    order: number;
  };
  index: number;
  columnId: string;
  boardId: string;
  onCardUpdate: (updatedCard: any) => void;
  onCardDelete: (cardId: string) => void;
}

export default function Card({
  card,
  index,
  columnId,
  boardId,
  onCardUpdate,
  onCardDelete,
}: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.700");
  const cardBorder = useColorModeValue("gray.200", "gray.600");

  // Delete card mutation
  const [deleteCard] = useMutation(DELETE_CARD, {
    onError: (error) => {
      toast({
        title: "Error deleting card",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    },
  });

  const handleDeleteCard = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this card?"
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteCard({
        variables: {
          cardId: card.id,
        },
      });

      onCardDelete(card.id);

      toast({
        title: "Card deleted",
        status: "success",
        duration: 2000,
      });

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting card:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format due date
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Check if due date is past
  const isDueDatePast = () => {
    if (!card.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(card.dueDate);
    return due < today;
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
            onClick={() => setIsModalOpen(true)}
            position="relative"
            _hover={{ boxShadow: "md" }}
          >
            {/* Display labels at the top */}
            {card.labels && card.labels.length > 0 && (
              <Flex mb={2} flexWrap="wrap" gap={1}>
                {card.labels.map((label) => {
                  const labelInfo =
                    LABEL_COLORS[label as keyof typeof LABEL_COLORS];
                  return (
                    <Box
                      key={label}
                      bg={labelInfo?.bg || "gray.500"}
                      h="8px"
                      w="40px"
                      borderRadius="full"
                    />
                  );
                })}
              </Flex>
            )}

            <Text fontWeight="medium">{card.title}</Text>

            {/* Show short description preview if available */}
            {card.description && (
              <Text
                fontSize="sm"
                color="gray.500"
                mt={1}
                noOfLines={2}
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {card.description}
              </Text>
            )}

            {/* Show due date badge if set */}
            {card.dueDate && (
              <Flex mt={2} alignItems="center">
                <Badge
                  colorScheme={isDueDatePast() ? "red" : "green"}
                  display="flex"
                  alignItems="center"
                  fontSize="xs"
                  px={1}
                >
                  <FiCalendar style={{ marginRight: "4px" }} />
                  {formatDueDate(card.dueDate)}
                </Badge>
              </Flex>
            )}
          </Box>
        )}
      </Draggable>

      {/* Card Modal */}
      {isModalOpen && (
        <CardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          card={card}
          columnId={columnId}
          onDelete={handleDeleteCard}
          onCardUpdate={onCardUpdate}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
