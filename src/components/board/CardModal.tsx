"use client";

import { useState, useRef, useEffect } from "react";
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
  Flex,
  Box,
  Text,
  IconButton,
  Badge,
  HStack,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  FormErrorMessage,
} from "@chakra-ui/react";
import { FiTrash2, FiCalendar, FiTag, FiMoreHorizontal } from "react-icons/fi";

// GraphQL mutations
const UPDATE_CARD = gql`
  mutation UpdateCard(
    $id: ID!
    $title: String
    $description: String
    $labels: [String]
    $dueDate: String
  ) {
    updateCard(
      id: $id
      title: $title
      description: $description
      labels: $labels
      dueDate: $dueDate
    ) {
      id
      title
      description
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

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: string;
    title: string;
    description?: string;
    labels?: string[];
    dueDate?: string;
  };
  columnId: string;
  onDelete: () => void;
}

export default function CardModal({
  isOpen,
  onClose,
  card,
  onDelete,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [labels, setLabels] = useState<string[]>(card.labels || []);
  const [dueDate, setDueDate] = useState(card.dueDate || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [showLabelSelector, setShowLabelSelector] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const [updateCard, { loading }] = useMutation(UPDATE_CARD, {
    onError: (error) => {
      toast({
        title: "Error updating card",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    },
  });

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }

    updateCard({
      variables: {
        id: card.id,
        title: title.trim(),
        description: description.trim() || null,
        labels: labels.length > 0 ? labels : null,
        dueDate: dueDate || null,
      },
    }).then(() => {
      toast({
        title: "Card updated",
        status: "success",
        duration: 2000,
      });
      onClose();
    });
  };

  const handleTitleSubmit = () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }

    setTitleError("");
    setIsEditingTitle(false);

    updateCard({
      variables: {
        id: card.id,
        title: title.trim(),
      },
    }).catch((error) => {
      toast({
        title: "Error updating title",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
  };

  const handleDescriptionBlur = () => {
    updateCard({
      variables: {
        id: card.id,
        description: description.trim() || null,
      },
    }).catch((error) => {
      toast({
        title: "Error updating description",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);

    updateCard({
      variables: {
        id: card.id,
        dueDate: e.target.value || null,
      },
    }).catch((error) => {
      toast({
        title: "Error updating due date",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    });
  };

  const toggleLabel = (color: string) => {
    const updatedLabels = labels.includes(color)
      ? labels.filter((l) => l !== color)
      : [...labels, color];

    setLabels(updatedLabels);

    updateCard({
      variables: {
        id: card.id,
        labels: updatedLabels.length > 0 ? updatedLabels : null,
      },
    }).catch((error) => {
      toast({
        title: "Error updating labels",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    });
  };

  const handleDeleteConfirm = () => {
    onDelete();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p={4} pb={2}>
          {isEditingTitle ? (
            <FormControl isInvalid={!!titleError}>
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError("");
                }}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSubmit();
                  if (e.key === "Escape") {
                    setTitle(card.title);
                    setIsEditingTitle(false);
                  }
                }}
                placeholder="Enter card title"
              />
              {titleError && <FormErrorMessage>{titleError}</FormErrorMessage>}
            </FormControl>
          ) : (
            <Text
              fontSize="xl"
              fontWeight="bold"
              onClick={() => setIsEditingTitle(true)}
              cursor="pointer"
              _hover={{ bg: "gray.50" }}
              p={1}
              borderRadius="md"
            >
              {title}
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Flex mb={6}>
            <Text fontSize="sm" color="gray.500" width="100px">
              In column
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              {/* You might want to fetch the column name here */}
              Column
            </Text>
          </Flex>

          {labels.length > 0 && (
            <Box mb={6}>
              <Text fontSize="sm" color="gray.500" mb={2}>
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
                    cursor="pointer"
                    onClick={() => toggleLabel(label)}
                  >
                    {label}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}

          {dueDate && (
            <Box mb={6}>
              <Text fontSize="sm" color="gray.500" mb={2}>
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

          <Box mb={6}>
            <FormLabel fontSize="sm" color="gray.500">
              Description
            </FormLabel>
            <Textarea
              value={description}
              onChange={handleDescriptionChange}
              onBlur={handleDescriptionBlur}
              placeholder="Add a more detailed description..."
              minH="120px"
              resize="vertical"
            />
          </Box>

          {showLabelSelector && (
            <Box mb={6}>
              <Text fontSize="sm" color="gray.500" mb={2}>
                Labels
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

        <Divider />

        <ModalFooter justifyContent="space-between">
          <HStack spacing={2}>
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
              onClick={() => document.getElementById("dueDateInput")?.click()}
            >
              Due Date
            </Button>
            <Input
              id="dueDateInput"
              type="date"
              value={dueDate}
              onChange={handleDueDateChange}
              display="none"
            />
          </HStack>

          <HStack spacing={2}>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMoreHorizontal />}
                variant="ghost"
                size="sm"
                aria-label="More options"
              />
              <MenuList>
                <MenuItem
                  icon={<FiTrash2 />}
                  color="red.500"
                  onClick={handleDeleteConfirm}
                >
                  Delete Card
                </MenuItem>
              </MenuList>
            </Menu>
            <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>
              Save
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
