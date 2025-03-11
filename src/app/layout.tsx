// app/layout.tsx
"use client";

import { ApolloProvider } from "@apollo/client";
import { AuthProvider } from "@/contexts/auth-context";
import { client } from "@/lib/apollo-client";
import { Providers } from "./chakra-ui/providers";
import Navbar from "@/components/Navbar";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ApolloProvider client={client}>
            <AuthProvider>
              <Navbar />
              <EmailVerificationBanner />
              {children}
            </AuthProvider>
          </ApolloProvider>
        </Providers>
      </body>
    </html>
  );
}
