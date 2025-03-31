"use client";

import { useState, useEffect } from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { getAuth } from "firebase/auth";

// Create a component that handles client-side only rendering
export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true when component mounts on client
    setMounted(true);

    // Create Apollo Client on the client side only
    const httpLink = new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "/api/graphql",
    });

    const authLink = setContext(async (_, { headers }) => {
      // Get the authentication token if it exists
      const auth = getAuth();
      let token = "";

      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (error) {
          console.error("Error getting token:", error);
        }
      }

      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : "",
        },
      };
    });

    const errorLink = onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        graphQLErrors.forEach(({ message, locations, path }) =>
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        );
      if (networkError) console.error(`[Network error]: ${networkError}`);
    });

    const client = new ApolloClient({
      link: from([errorLink, authLink, httpLink]),
      cache: new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              boards: {
                merge(existing, incoming) {
                  return incoming;
                },
              },
            },
          },
        },
      }),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: "cache-and-network",
        },
      },
    });

    setClient(client);
  }, []);

  // Fix hydration mismatch by not rendering anything on the server
  // and waiting until we're mounted on the client
  if (!mounted) {
    return null;
  }

  // Once mounted on client with initialized Apollo client
  if (!client) {
    return <div>Loading Apollo Client...</div>;
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
