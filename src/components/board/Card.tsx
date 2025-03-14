// src/components/board/Card.tsx
"use client";

import { Draggable } from "react-beautiful-dnd";
import { Box, Text, Badge, Flex, IconButton } from "@chakra-ui/react";
import { FiEdit2 } from "react-icons/fi";
import { useBoard } from "@/contexts/board-context";
import { useUI } from "@/contexts/ui-context";
import { Card as CardType } from "@/types/board";

interface CardProps {
  card: CardType;
  index: number;
  columnId: string;
}

export default function Card({ card, index }: CardProps) {
  const { setActiveCard } = useBoard();
  const { openModal } = useUI();

  const handleCardClick = () => {
    setActiveCard(card);
    openModal("cardDetail");
  };

  // Format due date if it exists
  const formattedDueDate = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString()
    : null;

  return (
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
          boxShadow={snapshot.isDragging ? "md" : "sm"}
          borderLeft={card.labels?.length ? "4px solid" : undefined}
          borderLeftColor={
            card.labels?.length ? `${card.labels[0]}.500` : undefined
          }
          onClick={handleCardClick}
          cursor="pointer"
          _hover={{ bg: "gray.50" }}
          position="relative"
        >
          <Text fontWeight="medium" mb={card.description ? 2 : 0}>
            {card.title}
          </Text>

          {card.description && (
            <Text
              fontSize="sm"
              color="gray.600"
              noOfLines={2}
              mb={card.labels?.length || card.dueDate ? 2 : 0}
            >
              {card.description}
            </Text>
          )}

          <Flex mt={1} wrap="wrap" gap={1}>
            {card.labels?.map((label) => (
              <Badge key={label} colorScheme={label} size="sm">
                {label}
              </Badge>
            ))}

            {formattedDueDate && (
              <Badge
                colorScheme={
                  new Date(card.dueDate!) < new Date() ? "red" : "green"
                }
                size="sm"
              >
                {formattedDueDate}
              </Badge>
            )}
          </Flex>

          <IconButton
            aria-label="Edit card"
            icon={<FiEdit2 />}
            size="xs"
            position="absolute"
            top={1}
            right={1}
            opacity={0}
            _groupHover={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveCard(card);
              openModal("cardDetail");
            }}
          />
        </Box>
      )}
    </Draggable>
  );
}
