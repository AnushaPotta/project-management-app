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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverFooter,
  PopoverArrow,
  Wrap,
  WrapItem,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiTrash2,
  FiCalendar,
  FiTag,
  FiMoreHorizontal,
  FiClock,
  FiX,
  FiCheck,
} from "react-icons/fi";

// GraphQL mutations
const UPDATE_CARD = gql`
  mutation UpdateCard($cardId: ID!, $input: CardUpdateInput!) {
    updateCard(cardId: $cardId, input: $input) {
      id
      title
      description
      assignedTo
      dueDate
      labels
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
  onCardUpdate: (updatedCard: any) => void;
  isDeleting: boolean;
}

export default function CardModal({
  isOpen,
  onClose,
  card,
  onDelete,
  onCardUpdate,
  isDeleting,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [labels, setLabels] = useState<string[]>(card.labels || []);
  const [dueDate, setDueDate] = useState(card.dueDate || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isDueDatePopoverOpen, setIsDueDatePopoverOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const labelBgColor = useColorModeValue("gray.100", "gray.700");

  const [updateCard] = useMutation(UPDATE_CARD, {
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

  const handleSaveCard = async () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await updateCard({
        variables: {
          cardId: card.id,
          input: {
            title: title.trim(),
            description: description.trim() || null,
            labels: labels.length > 0 ? labels : null,
            dueDate: dueDate || null,
          },
        },
      });

      onCardUpdate(data.updateCard);

      toast({
        title: "Card updated",
        status: "success",
        duration: 2000,
      });

      onClose();
    } catch (error) {
      console.error("Error saving card:", error);
    } finally {
      setIsSaving(false);
    }
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
        cardId: card.id,
        input: {
          title: title.trim(),
        },
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
        cardId: card.id,
        input: {
          description: description.trim() || null,
        },
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
  };

  const saveDueDate = () => {
    updateCard({
      variables: {
        cardId: card.id,
        input: {
          dueDate: dueDate || null,
        },
      },
    })
      .then(() => {
        setIsDueDatePopoverOpen(false);
        toast({
          title: "Due date updated",
          status: "success",
          duration: 2000,
        });
      })
      .catch((error) => {
        toast({
          title: "Error updating due date",
          description: error.message,
          status: "error",
          duration: 3000,
        });
      });
  };

  const removeDueDate = () => {
    setDueDate("");
    updateCard({
      variables: {
        cardId: card.id,
        input: {
          dueDate: null,
        },
      },
    })
      .then(() => {
        setIsDueDatePopoverOpen(false);
        toast({
          title: "Due date removed",
          status: "success",
          duration: 2000,
        });
      })
      .catch((error) => {
        toast({
          title: "Error removing due date",
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
        cardId: card.id,
        input: {
          labels: updatedLabels.length > 0 ? updatedLabels : null,
        },
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

  // Function to check if due date is past
  const isDueDatePast = () => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return due < today;
  };

  // Function to format due date
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);

    const isToday = () => {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };

    const isTomorrow = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return (
        date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear()
      );
    };

    if (isToday()) return "Today";
    if (isTomorrow()) return "Tomorrow";

    // Otherwise return formatted date
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div role="presentation">
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
                {titleError && (
                  <FormErrorMessage>{titleError}</FormErrorMessage>
                )}
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
            <Flex direction="column" gap={4}>
              {/* Labels section */}
              {labels.length > 0 && (
                <Box>
                  <Text mb={1} fontWeight="medium">
                    Labels
                  </Text>
                  <Wrap spacing={2}>
                    {labels.map((label) => {
                      const labelInfo =
                        LABEL_COLORS[label as keyof typeof LABEL_COLORS];
                      return (
                        <WrapItem key={label}>
                          <Badge
                            bg={labelInfo?.bg || "gray.500"}
                            color={labelInfo?.color || "white"}
                            px={2}
                            py={1}
                            borderRadius="md"
                            fontSize="sm"
                            cursor="pointer"
                            onClick={() => toggleLabel(label)}
                          >
                            {labelInfo?.name || label}
                          </Badge>
                        </WrapItem>
                      );
                    })}
                  </Wrap>
                </Box>
              )}

              {/* Due date section */}
              {dueDate && (
                <Box>
                  <Text mb={1} fontWeight="medium">
                    Due Date
                  </Text>
                  <Badge
                    colorScheme={isDueDatePast() ? "red" : "green"}
                    display="flex"
                    alignItems="center"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    <FiCalendar style={{ marginRight: "6px" }} />
                    {formatDueDate(dueDate)}
                  </Badge>
                </Box>
              )}

              {/* Description section */}
              <Box>
                <Text mb={1} fontWeight="medium">
                  Description
                </Text>
                <Textarea
                  value={description}
                  onChange={handleDescriptionChange}
                  onBlur={handleDescriptionBlur}
                  placeholder="Add a more detailed description..."
                  minH="120px"
                  resize="vertical"
                />
              </Box>
            </Flex>
          </ModalBody>

          <Divider />

          <ModalFooter justifyContent="space-between">
            <HStack spacing={2}>
              {/* Labels Popover */}
              <Popover
                isOpen={isLabelPopoverOpen}
                onClose={() => setIsLabelPopoverOpen(false)}
                placement="bottom-start"
              >
                <PopoverTrigger>
                  <Button
                    leftIcon={<FiTag />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsLabelPopoverOpen(!isLabelPopoverOpen)}
                  >
                    Labels
                  </Button>
                </PopoverTrigger>
                <PopoverContent width="250px">
                  <PopoverArrow />
                  <PopoverHeader fontWeight="medium" py={2}>
                    Labels
                  </PopoverHeader>
                  <PopoverBody>
                    <Wrap spacing={1}>
                      {Object.entries(LABEL_COLORS).map(
                        ([key, { bg, color, name }]) => (
                          <WrapItem key={key} width="100%">
                            <Button
                              width="100%"
                              justifyContent="flex-start"
                              height="30px"
                              bg={bg}
                              color={color}
                              _hover={{ opacity: 0.8 }}
                              leftIcon={
                                labels.includes(key) ? <FiCheck /> : undefined
                              }
                              onClick={() => toggleLabel(key)}
                            >
                              {name}
                            </Button>
                          </WrapItem>
                        )
                      )}
                    </Wrap>
                  </PopoverBody>
                </PopoverContent>
              </Popover>

              {/* Due Date Popover */}
              <Popover
                isOpen={isDueDatePopoverOpen}
                onClose={() => setIsDueDatePopoverOpen(false)}
                placement="bottom-start"
              >
                <PopoverTrigger>
                  <Button
                    leftIcon={<FiCalendar />}
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setIsDueDatePopoverOpen(!isDueDatePopoverOpen)
                    }
                  >
                    Due Date
                  </Button>
                </PopoverTrigger>
                <PopoverContent width="250px">
                  <PopoverArrow />
                  <PopoverHeader fontWeight="medium" py={2}>
                    Due Date
                  </PopoverHeader>
                  <PopoverBody>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={handleDueDateChange}
                      size="md"
                    />
                  </PopoverBody>
                  <PopoverFooter display="flex" justifyContent="space-between">
                    {dueDate && (
                      <Button
                        size="sm"
                        leftIcon={<FiX />}
                        variant="ghost"
                        onClick={removeDueDate}
                        colorScheme="red"
                      >
                        Remove
                      </Button>
                    )}
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={saveDueDate}
                      isDisabled={!dueDate}
                      ml="auto"
                    >
                      Save
                    </Button>
                  </PopoverFooter>
                </PopoverContent>
              </Popover>
            </HStack>

            <HStack spacing={2}>
              <Button
                colorScheme="red"
                variant="ghost"
                onClick={onDelete}
                isLoading={isDeleting}
                leftIcon={<FiTrash2 />}
              >
                Delete
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSaveCard}
                isLoading={isSaving}
              >
                Save
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
