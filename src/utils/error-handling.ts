// src/utils/error-handling.ts
import { ApolloError } from "@apollo/client";
import { UseToastOptions, ToastId } from "@chakra-ui/react";

// Define Toast function type
type ToastFunction = (options: UseToastOptions) => ToastId;

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

export function handleError(error: unknown, toast: ToastFunction): void {
  const message = getErrorMessage(error);
  console.error("Error:", error);

  toast({
    title: "Error",
    description: message,
    status: "error",
    duration: 5000,
    isClosable: true,
  });
}

// Optional: Enhanced error handling with specific error types
interface ErrorHandlingOptions {
  toast: ToastFunction;
  onRetry?: () => void;
  silent?: boolean;
}

export function handleErrorWithOptions(
  error: unknown,
  options: ErrorHandlingOptions
): void {
  const { toast, onRetry, silent = false } = options;
  const message = getErrorMessage(error);

  if (!silent) {
    console.error("Error:", error);
  }

  toast({
    title: "Error",
    description: message,
    status: "error",
    duration: 5000,
    isClosable: true,
    // Remove the action property as it's not supported directly
  });

  // If retry is needed, show a separate toast with retry action
  if (onRetry) {
    toast({
      title: "Action Available",
      description: "Would you like to retry?",
      status: "info",
      duration: null, // Toast won't auto-dismiss
      isClosable: true,
      position: "bottom-right",
      containerStyle: {
        marginBottom: "60px",
      },
    });
  }
}

// Custom error classes
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// Enhanced error handler with specific error types
export function handleSpecificError(
  error: unknown,
  toast: ToastFunction
): void {
  if (error instanceof NetworkError) {
    toast({
      title: "Network Error",
      description: "Please check your internet connection",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  } else if (error instanceof ValidationError) {
    toast({
      title: "Validation Error",
      description: error.message,
      status: "warning",
      duration: 5000,
      isClosable: true,
    });
  } else if (error instanceof ApolloError) {
    toast({
      title: "API Error",
      description: error.message,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  } else {
    handleError(error, toast);
  }
}
