import {
  Box,
  VStack,
  Icon,
  Flex,
  Text,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiHome,
  FiClipboard,
  FiCalendar,
  FiUsers,
  FiPieChart,
  FiSettings,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation"; // Add this import
import NextLink from "next/link";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, path, active = false, onClick }: SidebarItemProps) => {
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
        onClick={onClick}
      >
        <Icon as={icon} mr={4} fontSize="16" />
        <Text fontWeight={active ? "semibold" : "medium"}>{label}</Text>
      </Flex>
    </NextLink>
  );
};

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export default function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname(); // Use usePathname instead of router.pathname
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleLogoClick = () => {
    router.push('/');
  };

  // Handler that combines navigation with closing the drawer on mobile
  const handleNavigation = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <Box
      borderRight="1px"
      borderColor={borderColor}
      w={{ base: "100%", lg: "240px" }}
      h="100vh"
      py={5}
      bg={bgColor}
      overflowY="auto"
    >
      <VStack align="center" mb={6}>
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
      </VStack>

      <VStack align="start" spacing={1} px={3}>
        <SidebarItem
          icon={FiHome}
          label="Dashboard"
          path="/dashboard"
          active={pathname === "/dashboard"}
          onClick={handleNavigation}
        />
        <SidebarItem
          icon={FiClipboard}
          label="Boards"
          path="/boards"
          active={pathname.startsWith("/board")}
          onClick={handleNavigation}
        />
        <SidebarItem
          icon={FiCalendar}
          label="Calendar"
          path="/calendar"
          active={pathname === "/calendar"}
          onClick={handleNavigation}
        />
        <SidebarItem
          icon={FiUsers}
          label="Team"
          path="/team"
          active={pathname === "/team"}
          onClick={handleNavigation}
        />
        <SidebarItem
          icon={FiPieChart}
          label="Reports"
          path="/reports"
          active={pathname === "/reports"}
          onClick={handleNavigation}
        />

        <Divider my={6} />

        <SidebarItem
          icon={FiSettings}
          label="Settings"
          path="/settings"
          active={pathname === "/settings"}
          onClick={handleNavigation}
        />
      </VStack>
    </Box>
  );
}
