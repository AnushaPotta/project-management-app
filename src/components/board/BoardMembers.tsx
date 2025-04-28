// src/components/board/BoardMembers.tsx
import {
  Box,
  Avatar,
  AvatarGroup,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
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
}

interface BoardMembersProps {
  members: Member[];
  onInviteMember: (email: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function BoardMembers({
  members,
  onInviteMember,
  onRemoveMember,
}: BoardMembersProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [email, setEmail] = useState("");

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
                        name={member.name}
                        src={member.avatar}
                      />
                      <Box>
                        <Text fontWeight="bold">{member.name}</Text>
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