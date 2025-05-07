"use client";

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
  useColorModeValue,
  FormErrorMessage,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

interface EditBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string }) => void;
  initialData: {
    title: string;
    description?: string;
  };
  isLoading?: boolean;
}

export default function EditBoardModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: EditBoardModalProps) {
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description || "");
  const [titleError, setTitleError] = useState("");

  const bgColor = useColorModeValue("white", "gray.800");

  const handleSubmit = () => {
    // Validate title
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    
    onSubmit({ 
      title: title.trim(), 
      description: description.trim() 
    });
  };

  // Reset form when modal opens with new data
  // Use useEffect to monitor changes to isOpen and initialData
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setTitleError("");
    }
  }, [isOpen, initialData]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Edit Board Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!titleError}>
              <FormLabel>Board Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) {
                    setTitleError("");
                  }
                }}
                placeholder="Enter board title"
              />
              {titleError && <FormErrorMessage>{titleError}</FormErrorMessage>}
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add board description (optional)"
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
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
