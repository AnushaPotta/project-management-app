// src/components/Navbar.tsx
"use client";

import {
  Box,
  Flex,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Input,
  IconButton,
  useToast,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { FiPlus, FiHome, FiSettings, FiLogOut } from "react-icons/fi";
import { FirebaseError } from "firebase/app";

export default function Navbar() {
  const router = useRouter();
  const toast = useToast();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      const error = err as FirebaseError;
      toast({
        title: "Error signing out",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box bg="white" shadow="sm" py={2}>
      <Flex
        maxW="container.xl"
        mx="auto"
        px={4}
        align="center"
        justify="space-between"
      >
        {/* Left section */}
        <Flex gap={4} align="center">
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="blue.500"
            cursor="pointer"
            onClick={() => router.push("/")}
          >
            TaskFlow
          </Text>

          {user && (
            <>
              <IconButton
                aria-label="Home"
                icon={<FiHome />}
                variant="ghost"
                onClick={() => router.push("/dashboard")}
              />

              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                variant="ghost"
                onClick={() => router.push("/dashboard")}
              >
                Create
              </Button>
            </>
          )}
        </Flex>

        {/* Center section - Only show if user is logged in */}
        {user && (
          <Flex maxW="400px" flex={1} mx={8}>
            <Input
              placeholder="Search boards..."
              onClick={() => router.push("/search")}
              size="sm"
              borderRadius="md"
              _focus={{
                borderColor: "blue.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
              }}
            />
          </Flex>
        )}

        {/* Right section */}
        <Flex gap={4} align="center">
          {user ? (
            <Menu>
              <MenuButton
                as={Avatar}
                size="sm"
                name={user?.displayName || ""}
                src={user?.photoURL || ""}
                cursor="pointer"
                _hover={{
                  opacity: 0.8,
                }}
              />
              <MenuList>
                <MenuItem
                  icon={<FiSettings />}
                  onClick={() => router.push("/settings/profile")}
                >
                  Profile Settings
                </MenuItem>
                <MenuItem
                  icon={<FiSettings />}
                  onClick={() => router.push("/settings/workspace")}
                >
                  Workspace Settings
                </MenuItem>
                <MenuItem
                  icon={<FiLogOut />}
                  onClick={handleSignOut}
                  color="red.500"
                  _hover={{
                    bg: "red.50",
                  }}
                >
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Flex gap={2}>
              <Button
                variant="ghost"
                colorScheme="blue"
                onClick={() => router.push("/login")}
              >
                Log In
              </Button>
              <Button colorScheme="blue" onClick={() => router.push("/signup")}>
                Sign Up
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
