import { Box, Flex, useDisclosure, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerBody, useBreakpointValue } from "@chakra-ui/react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { FiMenu } from "react-icons/fi";
import { useState, useEffect } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMounted, setIsMounted] = useState(false);
  
  // Fix hydration issues by only showing mobile elements after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use breakpoint to determine if we're on mobile
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Only show drawer on mobile, fixed sidebar on desktop
  const showSidebar = !isMobile;

  return (
    <Flex h="100vh" direction="column">
      {/* Mobile Header with menu button */}
      {isMounted && isMobile && (
        <Box position="sticky" top={0} zIndex={10}>
          <DashboardHeader showMenuButton onMenuClick={onOpen} />
        </Box>
      )}

      <Flex flex="1" overflow="hidden">
        {/* Desktop Sidebar (fixed) */}
        {showSidebar && <DashboardSidebar onNavigate={() => {}} />}

        {/* Mobile Sidebar (drawer) */}
        {isMounted && isMobile && (
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent>
              <DrawerBody p={0}>
                <DashboardSidebar onNavigate={onClose} />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}

        {/* Main Content */}
        <Box flex="1" overflow="auto" w="100%">
          {/* Desktop Header */}
          {isMounted && !isMobile && <DashboardHeader />}
          
          <Box as="main" p={{ base: 3, md: 4, lg: 6 }}>
            {children}
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}
