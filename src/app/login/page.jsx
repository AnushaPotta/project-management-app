// app/login/page.tsx
"use client";

import { useState } from "react";
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Google sign-in failed",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: "Please enter your email to reset password" });
      return;
    }

    try {
      await resetPassword(email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password",
        status: "success",
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            Welcome back
          </Heading>
          <Text color="gray.600">
            Log in to your TaskFlow account
          </Text>
        </Box>

        <Button
          leftIcon={<FcGoogle />}
          onClick={handleGoogleSignIn}
          isLoading={loading}
          variant="outline"
          size="lg"
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
              alignSelf="flex-end"
              color="brand.500"
              onClick={handleForgotPassword}
              size="sm"
            >
              Forgot password?
            </Button>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="full"
              mt={4}
              isLoading={loading}
            >
              Log In
            </Button>
          </VStack>
        </form>

        <Text textAlign="center">
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--chakra-colors-brand-500)" }}>
            Sign up
          </Link>
        </Text>
      </VStack>
    </Container>
  );
}
