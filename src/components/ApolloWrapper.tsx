// src/components/ApolloWrapper.tsx
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

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);

  useEffect(() => {
    const graphqlEndpoint =
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "/api/graphql";

    const httpLink = new HttpLink({
      uri: graphqlEndpoint,
    });

    const authLink = setContext(async (_, { headers }) => {
      if (typeof window !== "undefined") {
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
            authorization: token ? "Bearer " + token : "",
          },
        };
      }
      return { headers };
    });

    const errorLink = onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach((error) => {
          console.error("[GraphQL error]: Message: " + error.message);
        });
      }
      if (networkError) {
        console.error("[Network error]: " + networkError);
      }
    });

    const apolloClient = new ApolloClient({
      link: from([errorLink, authLink, httpLink]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: "cache-and-network",
        },
      },
      ssrMode: typeof window === "undefined",
    });

    setClient(apolloClient);
  }, []);

  if (!client) {
    return <>{children}</>;
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
