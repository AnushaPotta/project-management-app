// app/layout.tsx
"use client";

import { ChakraProvider, Box } from "@chakra-ui/react";
import { ApolloProvider } from "@apollo/client";
import { AuthProvider } from "@/contexts/auth-context";
import { theme } from "@/app/chakra-ui/providers";
import { client } from "@/lib/apollo-client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider theme={theme}>
          <ApolloProvider client={client}>
            <AuthProvider>
              <Box minH="100vh">{children}</Box>
            </AuthProvider>
          </ApolloProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
