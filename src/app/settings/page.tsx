// src/app/settings/page.tsx
"use client";

import { useState } from "react";
import { Box, Heading, useToast } from "@chakra-ui/react";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/ui/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsView from "@/components/settings/SettingsView";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <DashboardLayout>
          <Box p={5}>
            <Heading mb={6}>Settings</Heading>
            
            {authLoading ? (
              <LoadingState />
            ) : (
              <SettingsView user={user} />
            )}
          </Box>
        </DashboardLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}