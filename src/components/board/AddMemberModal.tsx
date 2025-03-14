// src/components/board/AddMemberModal.tsx
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
  useToast,
  Text,
} from "@chakra-ui/react";
import { handleError } from "@/utils/error-handling";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onInvite,
}: AddMemberModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Email is required",
        status: "error",
        duration: 2000,
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email format",
        status: "error",
        duration: 2000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onInvite(email);

      // Reset form
      setEmail("");
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
        <ModalHeader>Invite Member</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={4}>Invite a team member to collaborate on this board.</Text>
          <FormControl isRequired>
            <FormLabel>Email Address</FormLabel>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              type="email"
              autoFocus
            />
          </FormControl>
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
            Send Invitation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
