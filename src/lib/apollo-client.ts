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

// Specify the type for apolloClient
let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

export function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined", // True if on server
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "/api/graphql",
      // Add auth token to requests
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        // Cast to avoid TypeScript errors
        const options = init || {};

        // Only run in browser
        if (typeof window !== "undefined") {
          const auth = getAuth();
          const user = auth.currentUser;

          if (user) {
            // Get token and add to headers
            return user.getIdToken().then((token) => {
              options.headers = {
                ...options.headers,
                authorization: token ? `Bearer ${token}` : "",
              };

              return fetch(input, options);
            });
          }
        }

        return fetch(input, options);
      },
    }),
    cache: new InMemoryCache({
      // Define type policies for complex caching behavior
      typePolicies: {
        Board: {
          keyFields: ["id"],
        },
        Column: {
          keyFields: ["id"],
        },
        Card: {
          keyFields: ["id"],
        },
      },
    }),
    defaultOptions: {
      query: {
        fetchPolicy: "network-only" as FetchPolicy,
      },
      watchQuery: {
        fetchPolicy: "cache-and-network" as WatchQueryFetchPolicy,
      },
      // For mutations, only specify the options we need
      mutate: {
        // Mutation fetch policies are more limited
        // Valid options are: 'network-only' and 'no-cache'
        errorPolicy: "all", // This is valid without specifying fetchPolicy
      },
    },
  });
}

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client,
  // the initial state gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();

    // Restore the cache using the data passed from
    // getStaticProps/getServerSideProps combined with the existing cached data
    _apolloClient.cache.restore({
      ...existingCache,
      ...(initialState as NormalizedCacheObject),
    });
  }

  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;

  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;
  return _apolloClient;
}

// Export a singleton instance for client-side usage
export const client = initializeApollo();
