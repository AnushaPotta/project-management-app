// src/components/ApolloWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import {
  ApolloProvider,
  ApolloClient,
  NormalizedCacheObject,
} from "@apollo/client";
import { getApolloClient } from "@/lib/apollo-client";

export default function ApolloWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client, setClient] =
    useState<ApolloClient<NormalizedCacheObject> | null>(null);

  useEffect(() => {
    async function initClient() {
      const apolloClient = await getApolloClient();
      setClient(apolloClient);
    }

    initClient();
  }, []);

  if (!client) {
    // Simple loading state - replace with your preferred loading UI
    return <div>Loading Apollo Client...</div>;
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
