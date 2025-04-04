// src/app/chakra-ui/providers.tsx
"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { ApolloWrapper } from "@/components/ApolloWrapper";
import { AuthProvider } from "@/contexts/auth-context";
import { theme } from "@/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CacheProvider>
        <ChakraProvider theme={theme}>
          <ApolloWrapper>
            <AuthProvider>{children}</AuthProvider>
          </ApolloWrapper>
        </ChakraProvider>
      </CacheProvider>
    </>
  );
}
