// src/components/board/BoardMenu.tsx
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiMoreHorizontal, FiTrash2, FiArchive, FiEdit } from "react-icons/fi";

interface BoardMenuProps {
  onArchive?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function BoardMenu({ onArchive, onDelete, onEdit }: BoardMenuProps) {
  // Colors for better readability
  const archiveColor = useColorModeValue("blue.600", "blue.300");
  const archiveBg = useColorModeValue("blue.50", "blue.900");
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Board menu"
        icon={<FiMoreHorizontal />}
        variant="ghost"
      />
      <MenuList>
        <MenuItem icon={<FiEdit />} onClick={onEdit}>
          Edit Board Details
        </MenuItem>
        <MenuItem 
          icon={<FiArchive />} 
          onClick={onArchive} 
          color={archiveColor}
          bg={archiveBg}
          fontWeight="medium"
          _hover={{ bg: useColorModeValue("blue.100", "blue.800"), color: useColorModeValue("blue.700", "blue.100") }}
        >
          Archive Board
        </MenuItem>
        <MenuDivider />
        <MenuItem icon={<FiTrash2 />} onClick={onDelete} color="red.500">
          Delete Board
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
