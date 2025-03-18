// src/app/providers.tsx
"use client";

import { useState, useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { AuthProvider } from "@/contexts/auth-context";
import { BoardProvider } from "@/contexts/board-context";
import { UIProvider } from "@/contexts/ui-context";
import { client } from "@/lib/apollo-client";
import { ChakraProvider } from "@chakra-ui/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors by only rendering client components after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before hydration, render a minimal version
  if (!mounted) {
    return (
      <ChakraProvider>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </ChakraProvider>
    );
  }

  // After client-side hydration, render the full app
  return (
    <ErrorBoundary>
      <ChakraProvider>
        <ApolloProvider client={client}>
          <AuthProvider>
            <BoardProvider>
              <UIProvider>{children}</UIProvider>
            </BoardProvider>
          </AuthProvider>
        </ApolloProvider>
      </ChakraProvider>
    </ErrorBoundary>
  );
}
