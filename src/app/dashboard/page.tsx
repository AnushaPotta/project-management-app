// src/app/dashboard/page.tsx
"use client";

import { Container, useToast } from "@chakra-ui/react";
import { BoardList } from "@/components/board/BoardList";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USER_BOARDS, CREATE_BOARD } from "@/graphql/board";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/ui/LoadingState";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const { data, loading, error } = useQuery(GET_USER_BOARDS);
  const [createBoard] = useMutation(CREATE_BOARD);

  if (!user) {
    router.push("/login");
    return null;
  }

  if (loading) return <LoadingState />;

  if (error) {
    toast({
      title: "Error loading boards",
      description: error.message,
      status: "error",
      duration: 5000,
    });
  }

  const handleBoardClick = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  const handleCreateBoard = async (boardData: any) => {
    try {
      const { data } = await createBoard({
        variables: {
          input: boardData,
        },
        refetchQueries: [{ query: GET_USER_BOARDS }],
      });

      router.push(`/board/${data.createBoard.id}`);
    } catch (error) {
      toast({
        title: "Error creating board",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
      <BoardList
        boards={data?.boards || []}
        onBoardClick={handleBoardClick}
        onCreateBoard={handleCreateBoard}
      />
    </Container>
  );
}
