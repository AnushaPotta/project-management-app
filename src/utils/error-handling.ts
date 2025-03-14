// src/utils/error-handling.ts
import { ApolloError } from "@apollo/client";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

export function handleError(error: unknown, toast: any) {
  const message = getErrorMessage(error);
  console.error("Error:", error);
  toast({
    title: "Error",
    description: message,
    status: "error",
    duration: 5000,
  });
}
