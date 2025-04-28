// src/components/board/AddMemberModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  useToast,
  Text,
  VStack,
  HStack,
  Box,
  Avatar,
  Divider,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { FiTrash, FiMail, FiPlus } from "react-icons/fi";
import { handleError } from "@/utils/error-handling";
import { useMutation, useQuery } from "@apollo/client";
import { GET_BOARD, INVITE_MEMBER, REMOVE_MEMBER } from "@/graphql/board";

interface BoardMember {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
  role?: string;
  status?: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  currentUserId: string;
  isOwner: boolean;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  boardId,
  currentUserId,
  isOwner,
}: AddMemberModalProps) {
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [emailError, setEmailError] = useState("");
  const toast = useToast();

  // Get board details including members
  const { data: boardData, loading: boardLoading, refetch } = useQuery(GET_BOARD, {
    variables: { id: boardId },
    skip: !isOpen, // Only fetch when modal is open
  });

  const members = boardData?.board?.members || [];

  // Invite member mutation
  const [inviteMember, { loading: inviteLoading }] = useMutation(INVITE_MEMBER, {
    onCompleted: () => {
      toast({
        title: "Invitation sent",
        description: "An email has been sent to invite the user",
        status: "success",
        duration: 3000,
      });
      setEmail("");
      refetch();
    },
    onError: (error) => {
      handleError(error, toast);
    },
  });

  // Remove member mutation
  const [removeMember, { loading: removeLoading }] = useMutation(REMOVE_MEMBER, {
    onCompleted: () => {
      toast({
        title: "Member removed",
        description: "The member has been removed from the board",
        status: "success",
        duration: 3000,
      });
      refetch();
    },
    onError: (error) => {
      handleError(error, toast);
    },
  });

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    // Check if already a member
    if (members.some((member: any) => member.email?.toLowerCase() === email.toLowerCase())) {
      setEmailError('This user is already a member');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) validateEmail(value);
  };

  const handleInvite = async () => {
    if (!validateEmail(email)) {
      return;
    }

    try {
      await inviteMember({
        variables: {
          boardId,
          email,
        },
      });
      // The success toast is handled in the mutation's onCompleted callback
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember({
        variables: {
          boardId,
          memberId,
        },
      });
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "PENDING":
        return <Badge colorScheme="yellow">Pending</Badge>;
      case "ACCEPTED":
        return <Badge colorScheme="green">Active</Badge>;
      case "REJECTED":
        return <Badge colorScheme="red">Rejected</Badge>;
      default:
        return <Badge colorScheme="green">Active</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Board Members</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs index={activeTab} onChange={(index) => setActiveTab(index)} isFitted>
            <TabList mb={4}>
              <Tab>Members</Tab>
              {isOwner && <Tab>Invite</Tab>}
            </TabList>

            <TabPanels>
              {/* Members Tab */}
              <TabPanel p={0}>
                {boardLoading ? (
                  <Flex justify="center" py={8}>
                    <Spinner />
                  </Flex>
                ) : members.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Text color="gray.500">No members found.</Text>
                    {isOwner && (
                      <Button
                        mt={4}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab(1)}
                      >
                        Invite Members
                      </Button>
                    )}
                  </Box>
                ) : (
                  <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                    {members.map((member: BoardMember) => (
                      <HStack 
                        key={member.id} 
                        justify="space-between" 
                        p={3} 
                        borderRadius="md" 
                        borderWidth="1px"
                        borderColor="gray.200"
                        _hover={{ bg: "gray.50" }}
                      >
                        <HStack>
                          <Avatar
                            size="sm"
                            name={member.name || member.email}
                            src={member.avatar}
                          />
                          <Box>
                            <HStack>
                              <Text fontWeight="bold">{member.name || member.email}</Text>
                              {member.role === "ADMIN" || member.role === "OWNER" ? (
                                <Text fontSize="xs" color="purple.500" fontWeight="bold">
                                  {member.role}
                                </Text>
                              ) : getStatusBadge(member.status)}
                            </HStack>
                            {member.name && member.email && (
                              <Text fontSize="sm" color="gray.500">
                                {member.email}
                              </Text>
                            )}
                          </Box>
                        </HStack>
                        
                        {isOwner && member.id !== currentUserId && member.role !== "ADMIN" && member.role !== "OWNER" && (
                          <IconButton
                            aria-label="Remove member"
                            icon={<FiTrash />}
                            variant="ghost"
                            colorScheme="red"
                            size="sm"
                            isLoading={removeLoading}
                            onClick={() => handleRemoveMember(member.id)}
                          />
                        )}
                      </HStack>
                    ))}
                  </VStack>
                )}
              </TabPanel>

              {/* Invite Tab */}
              {isOwner && (
                <TabPanel p={0}>
                  <Text mb={4}>Invite a team member to collaborate on this board.</Text>
                  <FormControl isInvalid={!!emailError}>
                    <FormLabel>Invite a new member</FormLabel>
                    <HStack>
                      <Input
                        placeholder="Email address"
                        value={email}
                        onChange={handleEmailChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                      />
                      <Button
                        leftIcon={<FiMail />}
                        colorScheme="blue"
                        onClick={handleInvite}
                        isLoading={inviteLoading}
                        loadingText="Inviting"
                      >
                        Invite
                      </Button>
                    </HStack>
                    {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
                  </FormControl>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}