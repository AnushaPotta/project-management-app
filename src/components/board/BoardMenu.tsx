// src/components/board/BoardMenu.tsx
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
} from "@chakra-ui/react";
import { FiMoreHorizontal, FiTrash2, FiArchive, FiEdit } from "react-icons/fi";

interface BoardMenuProps {
  onArchive?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function BoardMenu({ onArchive, onDelete, onEdit }: BoardMenuProps) {
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
        <MenuItem icon={<FiArchive />} onClick={onArchive}>
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
