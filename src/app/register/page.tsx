// src/app/register/page.tsx or similar file
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  useToast,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
} from "@chakra-ui/react";
import { registerWithEmailAndPassword } from "@/lib/firebase";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast({
        title: "All fields are required",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      await registerWithEmailAndPassword(email, password, name);

      toast({
        title: "Account created successfully",
        description: "Welcome to the app!",
        status: "success",
        duration: 5000,
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Registration error:", error);

      if (error instanceof FirebaseError) {
        let errorMessage = "Registration failed";

        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email is already in use";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address";
            break;
          case "auth/weak-password":
            errorMessage = "Password should be at least 6 characters";
            break;
          case "auth/network-request-failed":
            errorMessage = "Network error. Please check your connection";
            break;
          case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
          case "auth/api-key-not-valid":
            errorMessage =
              "Firebase configuration error. Please contact support.";
            console.error("Firebase API Key issue detected");
            break;
          default:
            errorMessage = `Registration failed: ${error.message}`;
        }

        toast({
          title: "Registration failed",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Handle non-Firebase errors
        toast({
          title: "Registration failed",
          description: "An unexpected error occurred",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg">
      <VStack spacing={6}>
        <Heading size="lg">Create an Account</Heading>

        <FormControl id="name" isRequired>
          <FormLabel>Full Name</FormLabel>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
        </FormControl>

        <FormControl id="email" isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
          />
        </FormControl>

        <FormControl id="password" isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </FormControl>

        <Button
          colorScheme="blue"
          width="full"
          onClick={handleSubmit}
          isLoading={loading}
        >
          Create Account
        </Button>

        <Text>
          Already have an account?{" "}
          <Link color="blue.500" href="/login">
            Log in
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}
