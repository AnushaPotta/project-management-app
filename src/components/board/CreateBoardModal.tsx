// src/components/board/CreateBoardModal.tsx
"use client";

import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
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
  FormErrorMessage,
  useToast,
} from "@chakra-ui/react";

// GraphQL mutation for creating a board
const CREATE_BOARD = gql`
  mutation CreateBoard($title: String!) {
    createBoard(title: $title) {
      id
      title
    }
  }
`;

// Query to refetch after creating a board
const GET_BOARDS = gql`
  query GetBoards {
    boards {
      id
      title
    }
  }
`;

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard?: (boardName: string) => void; // Made optional
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  onCreateBoard,
}) => {
  const [boardName, setBoardName] = useState("");
  const [error, setError] = useState("");
  const toast = useToast();

  // Set up the mutation
  const [createBoard, { loading: isLoading }] = useMutation(CREATE_BOARD, {
    refetchQueries: [{ query: GET_BOARDS }],
    onCompleted: (data) => {
      setBoardName("");
      setError("");
      onClose();
      toast({
        title: "Board created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Call the optional callback if provided
      if (onCreateBoard) {
        onCreateBoard(data.createBoard.title);
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating board",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = () => {
    // Validate
    if (!boardName.trim()) {
      setError("Board name is required");
      return;
    }

    if (boardName.length > 50) {
      setError("Board name cannot exceed 50 characters");
      return;
    }

    // Execute the mutation
    createBoard({ variables: { title: boardName.trim() } });
  };

  const handleClose = () => {
    setBoardName("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Board</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isInvalid={!!error}>
            <FormLabel>Board Name</FormLabel>
            <Input
              placeholder="Enter board name"
              value={boardName}
              onChange={(e) => {
                setBoardName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
            />
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            isLoading={isLoading}
            onClick={handleSubmit}
          >
            Create
          </Button>
          <Button onClick={handleClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateBoardModal;
