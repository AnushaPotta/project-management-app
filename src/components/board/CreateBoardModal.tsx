// src/components/board/CreateBoardModal.tsx
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
  VStack,
  FormErrorMessage,
} from "@chakra-ui/react";
import { useState } from "react";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (boardData: {
    title: string;
    description?: string;
  }) => Promise<void>;
  isCreating: boolean;
}

export function CreateBoardModal({
  isOpen,
  onClose,
  onCreateBoard,
  isCreating,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    await onCreateBoard({
      title: title.trim(),
      description: description.trim(),
    });

    setTitle("");
    setDescription("");
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Board</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.title}>
              <FormLabel>Board Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter board title"
              />
              {errors.title && (
                <FormErrorMessage>{errors.title}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter board description"
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isCreating}
            loadingText="Creating..."
          >
            Create Board
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
