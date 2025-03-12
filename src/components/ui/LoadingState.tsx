// src/components/ui/LoadingState.tsx
import { Flex, Spinner, Text } from "@chakra-ui/react";

export function LoadingState() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="200px"
      gap={4}
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.500"
        size="xl"
      />
      <Text color="gray.500">Loading...</Text>
    </Flex>
  );
}
