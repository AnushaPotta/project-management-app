// components/Navbar.tsx
"use client";

import {
  Box,
  Flex,
  Heading,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { FirebaseError } from "firebase/app";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
      toast({
        title: "Logged out successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      // Properly type the error as FirebaseError
      const firebaseError = error as FirebaseError;
      toast({
        title: "Logout failed",
        description: firebaseError.message || "An error occurred during logout",
        status: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Box as="nav" py={4} px={8} bg="white" boxShadow="sm">
      <Flex
        justify="space-between"
        align="center"
        maxW="container.xl"
        mx="auto"
      >
        <Heading as="h1" size="lg" color="brand.700">
          <Link href={user ? "/dashboard" : "/"}>TaskFlow</Link>
        </Heading>

        {user ? (
          <Menu>
            <MenuButton as={Button} variant="ghost" p={0}>
              <Avatar
                size="sm"
                name={user.displayName || undefined}
                src={user.photoURL || undefined}
              />
            </MenuButton>
            <MenuList>
              <MenuItem as={Link} href="/profile">
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Flex gap={4}>
            <Button as={Link} href="/login" variant="outline">
              Log in
            </Button>
            <Button as={Link} href="/register">
              Sign up
            </Button>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
