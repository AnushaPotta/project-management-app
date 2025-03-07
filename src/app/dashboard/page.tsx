"use client";

import { useEffect, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "@/contexts/auth-context";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Icon,
  Text,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import Link from "next/link";
import CreateBoardModal from "@/components/board/CreateBoardModal";

const GET_BOARDS = gql`
  query GetBoards {
    boards {
      id
      title
    }
  }
`;

export default function Dashboard() {
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data, loading, error } = useQuery(GET_BOARDS);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Loading your boards...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color="red.500">Error loading boards: {error.message}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg">Your Boards</Heading>
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="brand"
          onClick={onOpen}
        >
          Create Board
        </Button>
      </Flex>

      <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
        {data?.boards.map((board: { id: string; title: string }) => (
          <Link key={board.id} href={`/board/${board.id}`} passHref>
            <Box
              as="a"
              height="150px"
              p={4}
              borderRadius="md"
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="md"
              transition="transform 0.2s"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "lg",
                borderColor: "brand.500",
              }}
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Heading size="md" textAlign="center">
                {board.title}
              </Heading>
            </Box>
          </Link>
        ))}

        <Box
          height="150px"
          p={4}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          borderStyle="dashed"
          display="flex"
          justifyContent="center"
          alignItems="center"
          cursor="pointer"
          _hover={{
            bg: "gray.50",
            borderColor: "brand.500",
          }}
          onClick={onOpen}
        >
          <Flex direction="column" align="center">
            <Icon as={FiPlus} fontSize="2xl" mb={2} />
            <Text>Create New Board</Text>
          </Flex>
        </Box>
      </Grid>

      <CreateBoardModal isOpen={isOpen} onClose={onClose} />
    </Container>
  );
}
