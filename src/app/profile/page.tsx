// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Avatar,
  useToast,
  FormErrorMessage,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FirebaseError } from "firebase/app";
import { useRef } from "react";

function ProfileContent() {
  const {
    user,
    updateProfile,
    resetPassword,

    verifyEmail,
    deleteAccount,
    updatePassword,
  } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(
    null
  ) as React.RefObject<HTMLButtonElement>;

  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!displayName.trim()) {
      setErrors({ displayName: "Display name is required" });
      return;
    }

    setIsUpdating(true);
    setErrors({});

    try {
      await updateProfile({ displayName: displayName.trim() });
      toast({
        title: "Profile updated",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast({
        title: "Failed to update profile",
        description: firebaseError.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsUpdating(true);
    setErrors({});

    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast({
        title: "Failed to update password",
        description: firebaseError.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setIsSendingVerification(true);

    try {
      await verifyEmail();
      toast({
        title: "Verification email sent",
        description: "Please check your inbox",
        status: "success",
        duration: 3000,
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
      setIsSendingVerification(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword(email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast({
        title: "Failed to send reset email",
        description: firebaseError.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast({
        title: "Account deleted",
        status: "info",
        duration: 3000,
      });
      router.push("/");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast({
        title: "Failed to delete account",
        description: firebaseError.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Heading size="lg" mb={6}>
        Your Profile
      </Heading>

      <Stack spacing={8}>
        {/* Profile Information */}
        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <Flex direction={{ base: "column", md: "row" }} align="center" mb={6}>
            <Avatar
              size="xl"
              name={user?.displayName || undefined}
              src={user?.photoURL || undefined}
              mr={{ base: 0, md: 6 }}
              mb={{ base: 4, md: 0 }}
            />
            <Box>
              <Heading size="md">{user?.displayName || "User"}</Heading>
              <Text color="gray.600">{user?.email}</Text>
              <Flex mt={2} align="center">
                <Text
                  fontSize="sm"
                  color={user?.emailVerified ? "green.500" : "orange.500"}
                  fontWeight="medium"
                >
                  {user?.emailVerified
                    ? "Email verified"
                    : "Email not verified"}
                </Text>
                {!user?.emailVerified && (
                  <Button
                    variant="link"
                    colorScheme="brand"
                    size="sm"
                    ml={2}
                    onClick={handleSendVerificationEmail}
                    isLoading={isSendingVerification}
                  >
                    Send verification email
                  </Button>
                )}
              </Flex>
            </Box>
          </Flex>

          <Stack spacing={4}>
            <FormControl isInvalid={!!errors.displayName}>
              <FormLabel>Display Name</FormLabel>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              {errors.displayName && (
                <FormErrorMessage>{errors.displayName}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input value={email} isReadOnly bg="gray.50" />
            </FormControl>

            <Button
              colorScheme="brand"
              onClick={handleProfileUpdate}
              isLoading={isUpdating}
              alignSelf="flex-start"
            >
              Update Profile
            </Button>
          </Stack>
        </Box>

        {/* Password Change */}
        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>
            Change Password
          </Heading>

          <Stack spacing={4}>
            <FormControl isInvalid={!!errors.currentPassword}>
              <FormLabel>Current Password</FormLabel>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              {errors.currentPassword && (
                <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.newPassword}>
              <FormLabel>New Password</FormLabel>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errors.newPassword && (
                <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirm New Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              )}
            </FormControl>

            <Flex justify="space-between" align="center">
              <Button
                colorScheme="brand"
                onClick={handlePasswordChange}
                isLoading={isUpdating}
              >
                Change Password
              </Button>
              <Button
                variant="link"
                colorScheme="brand"
                onClick={handleResetPassword}
              >
                Forgot Password?
              </Button>
            </Flex>
          </Stack>
        </Box>

        {/* Account Management */}
        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>
            Account Management
          </Heading>

          <Stack spacing={4}>
            <Button colorScheme="red" variant="outline" onClick={onOpen}>
              Delete Account
            </Button>
          </Stack>
        </Box>
      </Stack>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Account
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This will permanently delete your account and all
              your data. This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAccount}
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
