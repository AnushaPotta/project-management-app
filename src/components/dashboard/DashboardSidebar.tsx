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

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname(); // Use usePathname instead of router.pathname
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <Box
      borderRight="1px"
      borderColor={borderColor}
      w="240px"
      h="100vh"
      py={5}
      bg={bgColor}
      position="sticky"
      top={0}
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
        />
        <SidebarItem
          icon={FiClipboard}
          label="Boards"
          path="/boards"
          active={pathname.startsWith("/board")}
        />
        <SidebarItem
          icon={FiCalendar}
          label="Calendar"
          path="/calendar"
          active={pathname === "/calendar"}
        />
        <SidebarItem
          icon={FiUsers}
          label="Team"
          path="/team"
          active={pathname === "/team"}
        />
        <SidebarItem
          icon={FiPieChart}
          label="Reports"
          path="/reports"
          active={pathname === "/reports"}
        />

        <Divider my={6} />

        <SidebarItem
          icon={FiSettings}
          label="Settings"
          path="/settings"
          active={pathname === "/settings"}
        />
      </VStack>
    </Box>
  );
}
