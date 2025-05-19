import { useState, useEffect } from "react";
import { Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, useBreakpointValue } from "@chakra-ui/react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { FiMenu } from "react-icons/fi";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMounted, setIsMounted] = useState(false);
  
  // Only check breakpoints after component is mounted (client-side)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine if we're on mobile
  const isMobile = useBreakpointValue({ base: true, md: false });
  const sidebarDisplay = useBreakpointValue({ base: "none", md: "block" });

  return (
    <Flex h="100vh" flexDirection="column">
      {/* Mobile header with menu button */}
      <Box display={{ base: "block", md: "none" }} bg="white" boxShadow="sm" p={2}>
        <Flex alignItems="center">
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            variant="ghost"
            onClick={onOpen}
            mr={2}
          />
          <DashboardHeader isMobile={true} />
        </Flex>
      </Box>

      {/* Main content area */}
      <Flex flex="1" overflow="auto">
        {/* Desktop sidebar - always visible on larger screens */}
        <Box
          display={sidebarDisplay}
          w="240px"
          h="100vh"
          position="sticky"
          top={0}
        >
          <DashboardSidebar />
        </Box>

        {/* Mobile sidebar - shown in drawer */}
        {isMounted && isMobile && (
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent maxW="240px">
              <DashboardSidebar closeDrawer={onClose} />
            </DrawerContent>
          </Drawer>
        )}

        {/* Main content */}
        <Box flex="1" overflow="auto">
          {/* Desktop header */}
          <Box display={{ base: "none", md: "block" }}>
            <DashboardHeader />
          </Box>
          <Box as="main" p={4}>
            {children}
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}
