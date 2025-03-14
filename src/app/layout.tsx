// src/app/layout.tsx
"use client";

import { ApolloProvider } from "@apollo/client";
import { AuthProvider } from "@/contexts/auth-context";
import { BoardProvider } from "@/contexts/board-context";
import { UIProvider } from "@/contexts/ui-context";
import { client } from "@/lib/apollo-client";
import { Providers } from "./chakra-ui/providers";
import Navbar from "@/components/Navbar";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/auth-context";

// Loading wrapper component
function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  return <>{children}</>;
}

// Main content wrapper
function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />
      <EmailVerificationBanner />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>
            <ApolloProvider client={client}>
              <AuthProvider>
                <BoardProvider>
                  <UIProvider>
                    <LoadingWrapper>
                      <MainContent>{children}</MainContent>
                    </LoadingWrapper>
                  </UIProvider>
                </BoardProvider>
              </AuthProvider>
            </ApolloProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
