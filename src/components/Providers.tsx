"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { ChakraProvider } from "@chakra-ui/react";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { useMemo } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => {
    return new ApolloClient({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "/api/graphql",
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: "cache-and-network",
        },
      },
    });
  }, []);

  return (
    <ChakraProvider>
      <ApolloProvider client={client}>
        <AuthProvider>{children}</AuthProvider>
      </ApolloProvider>
    </ChakraProvider>
  );
}
