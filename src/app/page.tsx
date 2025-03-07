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
    <Box as="main">
      <Box as="header" py={4} px={8} bg="white" boxShadow="sm">
        <Flex
          justify="space-between"
          align="center"
          maxW="container.xl"
          mx="auto"
        >
          <Heading as="h1" size="lg" color="brand.700">
            TaskFlow
          </Heading>
          <Flex gap={4}>
            <Button
              as={Link}
              href="/login"
              variant="outline"
              colorScheme="brand"
            >
              Log in
            </Button>
            <Button as={Link} href="/register" colorScheme="brand">
              Sign up
            </Button>
          </Flex>
        </Flex>
      </Box>

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
    </Box>
  );
}
