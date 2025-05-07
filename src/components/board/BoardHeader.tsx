// src/components/board/BoardHeader.tsx
import { Flex, Heading, Button, ButtonGroup, Input, IconButton, Tooltip } from "@chakra-ui/react";
import { FiStar, FiUsers, FiArrowLeft } from "react-icons/fi";
import { useState } from "react";
import { BoardMenu } from "./BoardMenu";
import { useRouter } from "next/navigation";
interface BoardHeaderProps {
  title: string;
  members: number;
  isStarred?: boolean;
  onTitleChange: (newTitle: string) => void;
  onToggleStar: () => void;
  onInviteMember: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onEdit?: () => void;
}

export function BoardHeader({
  title,
  members,
  isStarred = false,
  onTitleChange,
  onToggleStar,
  onInviteMember,
  onDelete,
  onArchive,
  onEdit,
}: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const router = useRouter();

  const handleTitleSubmit = () => {
    if (newTitle.trim() !== "") {
      onTitleChange(newTitle.trim());
      setIsEditing(false);
    }
  };

  return (
    <Flex
      justify="space-between"
      align="center"
      p={4}
      bg="rgba(255, 255, 255, 0.3)"
    >
      <Flex align="center" gap={4}>
        <Tooltip label="Back to Boards">
          <IconButton
            icon={<FiArrowLeft />}
            aria-label="Back to Boards"
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            mr={2}
          />
        </Tooltip>
        
        {isEditing ? (
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyPress={(e) => e.key === "Enter" && handleTitleSubmit()}
            autoFocus
            size="lg"
            fontWeight="bold"
            maxW="300px"
          />
        ) : (
          <Heading
            size="lg"
            onClick={() => setIsEditing(true)}
            cursor="pointer"
            _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
            p={2}
            borderRadius="md"
          >
            {title}
          </Heading>
        )}

        <ButtonGroup size="sm" spacing={2}>
          <Button
            leftIcon={<FiStar />}
            variant={isStarred ? "solid" : "outline"}
            colorScheme={isStarred ? "yellow" : "gray"}
            onClick={onToggleStar}
          >
            {isStarred ? "Starred" : "Star"}
          </Button>
          <Button leftIcon={<FiUsers />} onClick={onInviteMember}>
            {members} {members === 1 ? "Member" : "Members"}
          </Button>
        </ButtonGroup>
      </Flex>

      <BoardMenu 
        onDelete={onDelete}
        onArchive={onArchive}
        onEdit={onEdit}
      />
    </Flex>
  );
}