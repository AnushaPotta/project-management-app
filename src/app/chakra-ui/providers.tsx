// src/app/chakra-ui/providers.tsx
"use client";

import { ChakraProvider } from "@chakra-ui/react";
import ApolloWrapper from "@/components/ApolloWrapper";
import { AuthProvider } from "@/contexts/auth-context"; // Import your auth provider

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
      <ApolloWrapper>
        <AuthProvider>{children}</AuthProvider>
      </ApolloWrapper>
    </ChakraProvider>
  );
}
