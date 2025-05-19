import {
  Box,
  VStack,
  Icon,
  Flex,
  Text,
  Divider,
  useColorModeValue,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import {
  FiHome,
  FiClipboard,
  FiCalendar,
  FiUsers,
  FiPieChart,
  FiSettings,
  FiX,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import NextLink from "next/link";

const SidebarItem = ({ icon, label, path, active = false }) => {
  const activeBg = useColorModeValue("blue.50", "blue.900");
  const activeColor = useColorModeValue("blue.600", "blue.200");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  return (
    <NextLink href={path} passHref>
      <Flex
        align="center"
        p={3}
        borderRadius="md"
        role="group"
        cursor="pointer"
        bg={active ? activeBg : "transparent"}
        color={active ? activeColor : "inherit"}
        _hover={{ bg: hoverBg }}
        w="100%"
      >
        <Icon as={icon} mr={4} fontSize="16" />
        <Text fontWeight={active ? "semibold" : "medium"}>{label}</Text>
      </Flex>
    </NextLink>
  );
};

interface DashboardSidebarProps {
  closeDrawer?: () => void;
}

export default function DashboardSidebar({ closeDrawer }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname(); 
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleLogoClick = () => {
    router.push('/');
    if (closeDrawer) closeDrawer();
  };

  const handleNavigation = (path: string) => {
    if (closeDrawer) closeDrawer();
  };

  return (
    <Box
      borderRight="1px"
      borderColor={borderColor}
      w="full"
      h="100vh"
      py={5}
      bg={bgColor}
      position="relative"
      top={0}
    >
      <HStack justify="space-between" px={4} mb={6}>
        <Text 
          fontSize="2xl" 
          fontWeight="bold"
          cursor="pointer"
          _hover={{ color: "blue.500" }}
          transition="color 0.2s"
          onClick={handleLogoClick}
        >
          TaskFlow
        </Text>
        {closeDrawer && (
          <IconButton
            aria-label="Close menu"
            icon={<FiX />}
            size="sm"
            variant="ghost"
            onClick={closeDrawer}
          />
        )}
      </HStack>

      <VStack align="start" spacing={1} px={3}>
        <Box onClick={() => handleNavigation('/dashboard')}>
          <SidebarItem
            icon={FiHome}
            label="Dashboard"
            path="/dashboard"
            active={pathname === "/dashboard"}
          />
        </Box>
        <Box onClick={() => handleNavigation('/boards')}>
          <SidebarItem
            icon={FiClipboard}
            label="Boards"
            path="/boards"
            active={pathname.startsWith("/board")}
          />
        </Box>
        <Box onClick={() => handleNavigation('/calendar')}>
          <SidebarItem
            icon={FiCalendar}
            label="Calendar"
            path="/calendar"
            active={pathname === "/calendar"}
          />
        </Box>
        <Box onClick={() => handleNavigation('/team')}>
          <SidebarItem
            icon={FiUsers}
            label="Team"
            path="/team"
            active={pathname === "/team"}
          />
        </Box>
        <Box onClick={() => handleNavigation('/reports')}>
          <SidebarItem
            icon={FiPieChart}
            label="Reports"
            path="/reports"
            active={pathname === "/reports"}
          />
        </Box>

        <Divider my={6} />

        <Box onClick={() => handleNavigation('/settings')}>
          <SidebarItem
            icon={FiSettings}
            label="Settings"
            path="/settings"
            active={pathname === "/settings"}
          />
        </Box>
      </VStack>
    </Box>
  );
}
