// components/EmailVerificationBanner.tsx
"use client";

import { useState } from "react";
import { Box, Button, Flex, Text, useToast } from "@chakra-ui/react";
import { useAuth } from "@/contexts/auth-context";
import { FirebaseError } from "firebase/app";

export default function EmailVerificationBanner() {
  const { user, verifyEmail } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();

  // Don't show the banner if user is null, loading, or already verified
  if (!user || user.emailVerified) {
    return null;
  }

  const handleSendVerification = async () => {
    setIsSending(true);
    try {
      await verifyEmail();
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and verify your email",
        status: "success",
        duration: 5000,
      });
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast({
        title: "Failed to send verification email",
        description: firebaseError.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box bg="orange.100" py={2} px={4} width="100%">
      <Flex
        maxW="container.xl"
        mx="auto"
        justify="space-between"
        align="center"
      >
        <Text fontSize="sm">
          Please verify your email address to access all features.
        </Text>
        <Button
          size="sm"
          colorScheme="orange"
          onClick={handleSendVerification}
          isLoading={isSending}
        >
          Resend Verification Email
        </Button>
      </Flex>
    </Box>
  );
}
