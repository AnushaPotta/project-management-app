// src/app/board/[boardId]/page.tsx
"use client";

import { Box, Container, useToast } from "@chakra-ui/react";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardMembers } from "@/components/board/BoardMembers";
import { useQuery, useMutation } from "@apollo/client";
import { ApolloError } from "@apollo/client";
import {
  GET_BOARD,
  UPDATE_BOARD,
  INVITE_MEMBER,
  REMOVE_MEMBER,
} from "@/graphql/board";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/ui/LoadingState";
import { useRouter } from "next/navigation";

interface BoardPageProps {
  params: {
    boardId: string;
  };
}

export default function BoardPage({ params }: BoardPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  // Query for board data
  const { data, loading, error } = useQuery(GET_BOARD, {
    variables: { id: params.boardId },
  });

  // Mutations
  const [updateBoard] = useMutation(UPDATE_BOARD);
  const [inviteMember] = useMutation(INVITE_MEMBER);
  const [removeMember] = useMutation(REMOVE_MEMBER);

  if (!user) {
    router.push("/login");
    return null;
  }

  if (loading) return <LoadingState />;

  if (error) {
    toast({
      title: "Error loading board",
      description:
        error instanceof ApolloError
          ? error.message
          : "An unknown error occurred",
      status: "error",
      duration: 5000,
    });
    return null;
  }

  const board = data?.board;

  if (!board) {
    router.push("/dashboard");
    return null;
  }

  const handleTitleChange = async (newTitle: string) => {
    try {
      await updateBoard({
        variables: {
          id: board.id,
          input: { title: newTitle },
        },
      });
    } catch (err) {
      const error = err as ApolloError;
      toast({
        title: "Error updating board title",
        description: error.message || "An unknown error occurred",
        status: "error",
      });
    }
  };

  const handleToggleStar = async () => {
    try {
      await updateBoard({
        variables: {
          id: board.id,
          input: { isStarred: !board.isStarred },
        },
      });
    } catch (err) {
      const error = err as ApolloError;
      toast({
        title: "Error updating board",
        description: error.message || "An unknown error occurred",
        status: "error",
      });
    }
  };

  const handleInviteMember = async (email: string) => {
    try {
      await inviteMember({
        variables: {
          boardId: board.id,
          email,
        },
      });

      toast({
        title: "Invitation sent",
        status: "success",
      });
    } catch (err) {
      const error = err as ApolloError;
      toast({
        title: "Error inviting member",
        description: error.message || "An unknown error occurred",
        status: "error",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember({
        variables: {
          boardId: board.id,
          memberId,
        },
      });

      toast({
        title: "Member removed",
        status: "success",
      });
    } catch (err) {
      const error = err as ApolloError;
      toast({
        title: "Error removing member",
        description: error.message || "An unknown error occurred",
        status: "error",
      });
    }
  };

  return (
    <Box minH="100vh" bg={board.background || "gray.100"}>
      <BoardHeader
        title={board.title}
        members={board.members.length}
        isStarred={board.isStarred}
        onTitleChange={handleTitleChange}
        onToggleStar={handleToggleStar}
        onInviteMember={() => {}} // This will open BoardMembers modal
      />

      <Container maxW="container.xl" py={6}>
        <Box mb={6}>
          <BoardMembers
            members={board.members}
            onInviteMember={handleInviteMember}
            onRemoveMember={handleRemoveMember}
          />
        </Box>

        {/* Add your Column and Card components here */}
      </Container>
    </Box>
  );
}
