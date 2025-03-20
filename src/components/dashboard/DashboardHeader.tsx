import {
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Avatar,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiSearch, FiBell, FiHelpCircle, FiSettings } from "react-icons/fi";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardHeader() {
  const { user } = useAuth();
  const bgColor = useColorModeValue("white", "gray.800");

  return (
    <Box
      py={2}
      px={4}
      borderBottomWidth="1px"
      bg={bgColor}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex justify="space-between" align="center">
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input placeholder="Search..." borderRadius="full" />
        </InputGroup>

        <HStack spacing={4}>
          <IconButton
            aria-label="Notifications"
            icon={<FiBell />}
            variant="ghost"
            borderRadius="full"
          />
          <IconButton
            aria-label="Help"
            icon={<FiHelpCircle />}
            variant="ghost"
            borderRadius="full"
          />
          <IconButton
            aria-label="Settings"
            icon={<FiSettings />}
            variant="ghost"
            borderRadius="full"
          />

          <Menu>
            <MenuButton>
              <Avatar
                size="sm"
                name={user?.displayName || user?.email || undefined}
                src={user?.photoURL || undefined}
              />
            </MenuButton>
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Account Settings</MenuItem>
              <MenuItem>Sign Out</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
}
