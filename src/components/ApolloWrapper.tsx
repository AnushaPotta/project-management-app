// src/components/ApolloWrapper.tsx
"use client";

import { ApolloProvider } from "@apollo/client";
import { client } from "@/lib/apollo-client"; // Import the pre-configured client

export default function ApolloWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
