// src/components/board/BoardMembers.tsx
import {
  Box,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Input,
  VStack,
  HStack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { useState } from "react";

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string; // Add role field for admin status
}

interface BoardMembersProps {
  members: Member[];
  onInviteMember: (email: string) => void;
  onRemoveMember: (memberId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function BoardMembers({
  members,
  onInviteMember,
  onRemoveMember,
  isOpen: isOpenProp,
  onClose: onCloseProp,
}: BoardMembersProps) {
  // Use the provided isOpen and onClose props if available, otherwise use internal state
  const disclosure = useDisclosure();
  const isOpen = isOpenProp !== undefined ? isOpenProp : disclosure.isOpen;
  const onOpen = disclosure.onOpen;
  const onClose = onCloseProp || disclosure.onClose;
  
  const [email, setEmail] = useState("");
  
  // Debug members array
  console.log("Members in BoardMembers component:", members);

  // Function to get the best display name for a member
  const getDisplayName = (member: any) => {
    // If we have a proper name that's not just 'Admin', use it
    if (member.name && member.name !== 'Admin') {
      return member.name;
    }
    
    // If we have an email, use it or extract the username part from it
    if (member.email) {
      // Extract username from email (part before @)
      const emailUsername = member.email.split('@')[0];
      return emailUsername;
    }
    
    // If we have an ID, use a truncated version of it
    if (member.id) {
      return `User ${member.id.substring(0, 6)}`;
    }
    
    // Last resort
    return 'Unknown User';
  };

  const handleInvite = () => {
    if (email) {
      onInviteMember(email);
      setEmail("");
    }
  };

  return (
    <>
      <HStack spacing={2}>
        <AvatarGroup max={3} size="sm">
          {members.map((member) => (
            <Avatar key={member.id} name={member.name} src={member.avatar} />
          ))}
        </AvatarGroup>
        <Button size="sm" leftIcon={<FiPlus />} onClick={onOpen}>
          Add Member
        </Button>
      </HStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Manage Board Members</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={4}>
              <HStack w="100%">
                <Input
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button onClick={handleInvite}>Invite</Button>
              </HStack>

              <VStack w="100%" align="stretch">
                {members.map((member) => (
                  <HStack key={member.id} justify="space-between">
                    <HStack>
                      <Avatar
                        size="sm"
                        name={member.name !== 'Admin' ? member.name : member.email}
                        src={member.avatar}
                      />
                      <Box>
                        <HStack spacing={2}>
                          {/* Always use the best available name or identifier */}
                          <Text fontWeight="bold">
                            {getDisplayName(member)}
                          </Text>
                          {member.role === 'ADMIN' && (
                            <Text fontSize="xs" color="purple.500" fontWeight="bold">
                              ADMIN
                            </Text>
                          )}
                          {member.role === 'MEMBER' && (
                            <Text fontSize="xs" color="blue.500" fontWeight="bold">
                              MEMBER
                            </Text>
                          )}
                          {member.status === 'PENDING' && (
                            <Badge colorScheme="yellow" fontSize="xs">
                              PENDING
                            </Badge>
                          )}
                          {member.status === 'ACCEPTED' && (
                            <Badge colorScheme="green" fontSize="xs">
                              ACTIVE
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="gray.500">
                          {member.email}
                        </Text>
                      </Box>
                    </HStack>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => onRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}