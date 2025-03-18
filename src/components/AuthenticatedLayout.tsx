// src/components/AuthenticatedLayout.tsx
"use client";

import { ReactNode } from "react";
import { Box } from "@chakra-ui/react";
import Navbar from "@/components/Navbar";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/ui/LoadingState";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export default function AuthenticatedLayout({
  children,
  requireAuth = false,
}: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth();

  // Show loading state while auth is being determined
  if (loading) {
    return <LoadingState />;
  }

  // If authentication is required but user is not logged in,
  // you could redirect here or show a different UI
  // For now, we'll just render the content regardless

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Navbar />
      <EmailVerificationBanner />
      <Box as="main" flex="1">
        {children}
      </Box>
    </Box>
  );
}
