"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  FormErrorMessage,
  Box,
  Flex,
  Badge,
  Text,
} from "@chakra-ui/react";
import { FiTag, FiCalendar } from "react-icons/fi";

// GraphQL mutation for creating a card
const CREATE_CARD = gql`
  mutation CreateCard(
    $title: String!
    $description: String
    $columnId: ID!
    $labels: [String]
    $dueDate: String
  ) {
    createCard(
      title: $title
      description: $description
      columnId: $columnId
      labels: $labels
      dueDate: $dueDate
    ) {
      id
      title
      description
      columnId
      order
      labels
      dueDate
    }
  }
`;

// Query to refetch after creating a card
const GET_CARDS = gql`
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
`;

// Available label colors
const LABEL_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "cyan",
  "purple",
  "pink",
];

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
}

export default function AddCardModal({
  isOpen,
  onClose,
  columnId,
}: AddCardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [titleError, setTitleError] = useState("");
  const [showLabelSelector, setShowLabelSelector] = useState(false);

  const toast = useToast();

  const [createCard, { loading }] = useMutation(CREATE_CARD, {
    refetchQueries: [{ query: GET_CARDS, variables: { columnId } }],
    onCompleted: () => {
      toast({
        title: "Card created",
        status: "success",
        duration: 2000,
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error creating card",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }

    createCard({
      variables: {
        title: title.trim(),
        description: description.trim() || null,
        columnId,
        labels: labels.length > 0 ? labels : null,
        dueDate: dueDate || null,
      },
    });
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setLabels([]);
    setDueDate("");
    setTitleError("");
    setShowLabelSelector(false);
    onClose();
  };

  const toggleLabel = (color: string) => {
    setLabels(
      labels.includes(color)
        ? labels.filter((l) => l !== color)
        : [...labels, color]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Card</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <FormControl isInvalid={!!titleError} mb={4}>
            <FormLabel>Title</FormLabel>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError("");
              }}
              placeholder="Enter card title"
              autoFocus
            />
            {titleError && <FormErrorMessage>{titleError}</FormErrorMessage>}
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              resize="vertical"
              rows={3}
            />
          </FormControl>

          {labels.length > 0 && (
            <Box mb={4}>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Labels
              </Text>
              <Flex flexWrap="wrap" gap={2}>
                {labels.map((label) => (
                  <Badge
                    key={label}
                    colorScheme={label}
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {label}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}

          {dueDate && (
            <Box mb={4}>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Due Date
              </Text>
              <Text fontSize="sm">
                {new Date(dueDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </Box>
          )}

          {showLabelSelector && (
            <Box mb={4}>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Select Labels
              </Text>
              <Flex flexWrap="wrap" gap={2}>
                {LABEL_COLORS.map((color) => (
                  <Badge
                    key={color}
                    colorScheme={color}
                    px={2}
                    py={1}
                    borderRadius="md"
                    cursor="pointer"
                    opacity={labels.includes(color) ? 1 : 0.6}
                    onClick={() => toggleLabel(color)}
                  >
                    {color}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}
        </ModalBody>

        <ModalFooter justifyContent="space-between">
          <Flex gap={2}>
            <Button
              leftIcon={<FiTag />}
              size="sm"
              variant="ghost"
              onClick={() => setShowLabelSelector(!showLabelSelector)}
            >
              Labels
            </Button>
            <Button
              leftIcon={<FiCalendar />}
              size="sm"
              variant="ghost"
              onClick={() =>
                document.getElementById("newCardDueDateInput")?.click()
              }
            >
              Due Date
            </Button>
            <Input
              id="newCardDueDateInput"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              display="none"
            />
          </Flex>

          <Flex gap={2}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
            >
              Add Card
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
