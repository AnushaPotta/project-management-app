"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <Container maxW="container.xl" py={20}>
      <Flex direction={{ base: "column", md: "row" }} align="center" gap={10}>
        <VStack spacing={6} align="flex-start" flex={1}>
          <Heading as="h2" size="2xl">
            Manage your projects with ease
          </Heading>
          <Text fontSize="xl" color="gray.600">
            TaskFlow helps teams move work forward by organizing projects,
            tracking progress, and collaborating effectively.
          </Text>
          <Button as={Link} href="/register" size="lg" colorScheme="brand">
            Get Started - It&apos;s Free
          </Button>
        </VStack>

        <Box flex={1} position="relative" height="400px" width="100%">
          <Image
            src="/dashboard-preview.png"
            alt="TaskFlow Dashboard Preview"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </Box>
      </Flex>
    </Container>
  );
}
