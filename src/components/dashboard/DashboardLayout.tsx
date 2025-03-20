import { Box, Flex } from "@chakra-ui/react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Flex h="100vh">
      <DashboardSidebar />
      <Box flex="1" overflow="auto">
        <DashboardHeader />
        <Box as="main" p={4}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
