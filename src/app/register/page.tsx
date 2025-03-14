// app/register/page.tsx
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
import { FirebaseError } from "firebase/app";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const { register, signInWithGoogle } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsEmailLoading(true); // Use specific loading state for email registration

    try {
      await register(email, password, name);
      toast({
        title: "Account created successfully",
        status: "success",
        duration: 3000,
      });
      router.push("/dashboard");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast({
        title: "Registration failed",
        description:
          firebaseError.message || "An error occurred during registration",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsEmailLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true); // Use specific loading state for Google sign-in

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

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            Create your account
          </Heading>
          <Text color="gray.600">
            Join TaskFlow to start managing your projects
          </Text>
        </Box>

        <Button
          leftIcon={<FcGoogle />}
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
          loadingText="Signing up with Google..."
          variant="outline"
          size="lg"
          disabled={isEmailLoading} // Disable when email registration is in progress
        >
          Sign up with Google
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
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Full Name</FormLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
              {errors.name && (
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              )}
            </FormControl>

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

            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              )}
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="full"
              mt={4}
              isLoading={isEmailLoading}
              loadingText="Creating Account..."
              disabled={isGoogleLoading} // Disable when Google sign-in is in progress
            >
              Create Account
            </Button>
          </VStack>
        </form>
        {/* Disable link during loading */}
        <Text
          textAlign="center"
          opacity={isEmailLoading || isGoogleLoading ? 0.5 : 1}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--chakra-colors-brand-500)",
              pointerEvents:
                isEmailLoading || isGoogleLoading ? "none" : "auto",
            }}
          >
            Log in
          </Link>
        </Text>
      </VStack>
    </Container>
  );
}
