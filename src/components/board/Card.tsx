"use client";

import { Draggable } from "react-beautiful-dnd";
import { useMutation, gql } from "@apollo/client";
import {
  Box,
  Flex,
  Text,
  useDisclosure,
  useToast,
  Badge,
} from "@chakra-ui/react";
import CardModal from "./CardModal";

const DELETE_CARD = gql`
  mutation DeleteCard($id: ID!) {
    deleteCard(id: $id)
  }
`;

interface CardProps {
  card: {
    id: string;
    title: string;
    description?: string;
    labels?: string[];
    dueDate?: string;
  };
  index: number;
  columnId: string;
}

export default function Card({ card, index, columnId }: CardProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [deleteCard] = useMutation(DELETE_CARD, {
    refetchQueries: [
      {
        query: gql`
          query GetCards($columnId: ID!) {
            cards(columnId: $columnId) {
              id
              title
              description
              order
              labels
              dueDate
            }
          }
        `,
        variables: { columnId },
      },
    ],
  });

  const handleDeleteCard = () => {
    deleteCard({
      variables: {
        id: card.id,
      },
    })
      .then(() => {
        toast({
          title: "Card deleted",
          status: "success",
          duration: 2000,
        });
      })
      .catch((error) => {
        toast({
          title: "Error deleting card",
          description: error.message,
          status: "error",
          duration: 3000,
        });
      });
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
            p={2}
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            _hover={{ boxShadow: "md" }}
            opacity={snapshot.isDragging ? 0.8 : 1}
            onClick={onOpen}
            cursor="pointer"
          >
            {card.labels && card.labels.length > 0 && (
              <Flex mb={2} flexWrap="wrap" gap={1}>
                {card.labels.map((label, i) => (
                  <Badge key={i} colorScheme={label} variant="solid" size="sm">
                    {label}
                  </Badge>
                ))}
              </Flex>
            )}

            <Text fontWeight="medium">{card.title}</Text>

            {card.description && (
              <Text fontSize="sm" color="gray.600" noOfLines={2} mt={1}>
                {card.description}
              </Text>
            )}

            {card.dueDate && (
              <Text fontSize="xs" color="gray.500" mt={2}>
                Due: {new Date(card.dueDate).toLocaleDateString()}
              </Text>
            )}
          </Box>
        )}
      </Draggable>

      <CardModal
        isOpen={isOpen}
        onClose={onClose}
        card={card}
        columnId={columnId}
        onDelete={handleDeleteCard}
      />
    </>
  );
}
