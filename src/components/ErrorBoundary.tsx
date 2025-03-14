// src/components/ErrorBoundary.tsx
"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Button, Heading, Text, Container } from "@chakra-ui/react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxW="container.md" py={20}>
          <Box textAlign="center">
            <Heading mb={4}>Something went wrong</Heading>
            <Text mb={8} color="gray.600">
              {this.state.error?.message || "An unexpected error occurred"}
            </Text>
            <Button colorScheme="blue" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
