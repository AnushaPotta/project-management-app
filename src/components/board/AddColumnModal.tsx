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
  useToast,
} from "@chakra-ui/react";

const CREATE_COLUMN = gql`
  mutation CreateColumn($boardId: ID!, $title: String!, $order: Int!) {
    createColumn(boardId: $boardId, title: $title, order: $order) {
      id
      title
      boardId
      order
    }
  }
`;

const GET_COLUMNS = gql`
  query GetColumns($boardId: ID!) {
    columns(boardId: $boardId) {
      id
      title
      boardId
      order
    }
  }
`;

interface AddColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export default function AddColumnModal({
  isOpen,
  onClose,
  boardId,
}: AddColumnModalProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const [createColumn] = useMutation(CREATE_COLUMN, {
    refetchQueries: [{ query: GET_COLUMNS, variables: { boardId } }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    createColumn({
      variables: {
        boardId,
        title,
        order: 999, // This will be sorted on the server
      },
    })
      .then(() => {
        toast({
          title: "Column created",
          status: "success",
          duration: 2000,
        });
        setTitle("");
        onClose();
      })
      .catch((error) => {
        toast({
          title: "Error creating column",
          description: error.message,
          status: "error",
          duration: 3000,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Add new column</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Column title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter column title"
                autoFocus
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" type="submit" isLoading={isSubmitting}>
              Add Column
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
