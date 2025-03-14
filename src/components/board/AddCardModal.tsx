// src/components/board/AddCardModal.tsx
"use client";

import { useState } from "react";
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
  VStack,
} from "@chakra-ui/react";
import { CardInput } from "@/types/board";
import { handleError } from "@/utils/error-handling";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardData: CardInput) => Promise<void>;
}

export default function AddCardModal({
  isOpen,
  onClose,
  onSubmit,
}: AddCardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Title is required",
        status: "error",
        duration: 2000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description: description || undefined,
      });

      // Reset form
      setTitle("");
      setDescription("");
      onClose();
    } catch (error) {
      handleError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Card</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter card title"
                autoFocus
              />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter card description (optional)"
                rows={4}
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
            isLoading={isSubmitting}
          >
            Add Card
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
