// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  FormErrorMessage,
  Flex,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { FirebaseError } from "firebase/app";
import { LoadingState } from "@/components/ui/LoadingState";

export default function Login() {
  const [isClient, setIsClient] = useState(false);

  // Use this to safely access useAuth only on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render the login content on the client side
  if (!isClient) {
    return <LoadingState />;
  }

  return <LoginContent />;
}

// Separate the content to ensure useAuth is only called after AuthProvider is mounted
function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const { login, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsEmailLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast({
        title: "Login failed",
        description: firebaseError.message || "An error occurred during login",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast({
        title: "Google sign-in failed",
        description:
          firebaseError.message || "An error occurred during Google sign-in",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: "Please enter your email to reset password" });
      return;
    }

    setIsResetLoading(true);
    try {
      await resetPassword(email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password",
        status: "success",
        duration: 5000,
      });
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast({
        title: "Failed to send reset email",
        description:
          firebaseError.message ||
          "An error occurred while sending reset email",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            Welcome back
          </Heading>
          <Text color="gray.600">Log in to your TaskFlow account</Text>
        </Box>

        <Button
          leftIcon={<FcGoogle />}
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
          loadingText="Signing in with Google..."
          variant="outline"
          size="lg"
          disabled={isEmailLoading || isResetLoading}
        >
          Log in with Google
        </Button>

        <Flex align="center">
          <Divider />
          <Text px={3} color="gray.500">
            or
          </Text>
          <Divider />
        </Flex>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              {errors.email && (
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {errors.password && (
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              )}
            </FormControl>

            <Button
              variant="link"
              onClick={handleForgotPassword}
              isLoading={isResetLoading}
              loadingText="Sending reset email..."
              disabled={isEmailLoading || isGoogleLoading}
            >
              Forgot password?
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              mt={4}
              isLoading={isEmailLoading}
              loadingText="Logging in..."
              disabled={isGoogleLoading || isResetLoading}
            >
              Log In
            </Button>
          </VStack>
        </form>

        <Text textAlign="center">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{ color: "var(--chakra-colors-brand-500)" }}
          >
            Sign up
          </Link>
        </Text>
      </VStack>
    </Container>
  );
}
