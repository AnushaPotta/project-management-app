// src/lib/apollo-client.ts
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  NormalizedCacheObject,
  FetchPolicy,
  WatchQueryFetchPolicy,
} from "@apollo/client";
import { getAuth } from "firebase/auth";
import { persistCache, LocalStorageWrapper } from "apollo3-cache-persist";

// Will hold our client instance after initialization
let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

async function createApolloClient() {
  // Create cache with your existing configuration
  const cache = new InMemoryCache({
    typePolicies: {
      Board: { keyFields: ["id"] },
      Column: { keyFields: ["id"] },
      Card: { keyFields: ["id"] },
    },
  });

  // Set up cache persistence (only in browser)
  if (typeof window !== "undefined") {
    try {
      await persistCache({
        cache,
        storage: new LocalStorageWrapper(window.localStorage),
        maxSize: 1048576 * 5, // 5MB
      });
      console.log("Apollo cache persistence initialized");
    } catch (error) {
      console.error("Error initializing cache persistence:", error);
    }
  }

  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "/api/graphql",
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const options = init || {};

        if (typeof window !== "undefined") {
          const auth = getAuth();
          const user = auth.currentUser;

          if (user) {
            try {
              const token = await user.getIdToken();
              options.headers = {
                ...options.headers,
                authorization: token ? `Bearer ${token}` : "",
              };
            } catch (error) {
              console.error("Failed to get auth token:", error);
            }
          }
        }

        return fetch(input, options);
      },
    }),
    cache,
    defaultOptions: {
      query: {
        fetchPolicy: "cache-and-network" as FetchPolicy,
      },
      watchQuery: {
        fetchPolicy: "cache-and-network" as WatchQueryFetchPolicy,
        nextFetchPolicy: "cache-first",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
  });
}

// Returns a promise that resolves to the Apollo client
export async function getApolloClient() {
  if (!apolloClient) {
    apolloClient = await createApolloClient();
  }
  return apolloClient;
}

// Reset function if needed (e.g., for logout)
export function resetApolloClient() {
  apolloClient = null;
}

// We'll no longer export a synchronous client
// Remove or comment out: export const client = initializeApollo();
