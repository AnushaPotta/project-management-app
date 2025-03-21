// src/components/team/InviteForm.tsx
import { useState } from "react";
import {
  Button,
  Input,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Box,
} from "@chakra-ui/react";

export default function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleInvite = async () => {
    try {
      setIsLoading(true);
      // API call to send invitation

      toast({
        title: "Invitation sent",
        description: `Invitation email sent to ${email}`,
        status: "success",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="md">
      <FormControl mb={3}>
        <FormLabel>Email address</FormLabel>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
        />
      </FormControl>

      <FormControl mb={3}>
        <FormLabel>Role</FormLabel>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </Select>
      </FormControl>

      <Button
        colorScheme="blue"
        isLoading={isLoading}
        onClick={handleInvite}
        isDisabled={!email}
      >
        Send Invitation
      </Button>
    </Box>
  );
}
