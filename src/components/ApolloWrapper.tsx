// src/components/ApolloWrapper.tsx
"use client";

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
} from "@apollo/client";

// Create Apollo Client instance
const client = new ApolloClient({
  link: new HttpLink({
    uri: "YOUR_GRAPHQL_ENDPOINT",
    // Add any necessary headers or authentication
  }),
  cache: new InMemoryCache(),
});

export default function ApolloWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
