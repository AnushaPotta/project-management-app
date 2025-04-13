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
  Text,
  Badge,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Divider,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { FiSearch, FiBell, FiHelpCircle, FiSettings, FiCheckCircle, FiInfo, FiBookOpen, FiCode, FiMessageSquare } from "react-icons/fi";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import NextLink from "next/link";

export default function DashboardHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const bgColor = useColorModeValue("white", "gray.800");
  const notificationBg = useColorModeValue("gray.50", "gray.700");
  
  // Help drawer controls
  const { 
    isOpen: isHelpOpen, 
    onOpen: onHelpOpen, 
    onClose: onHelpClose 
  } = useDisclosure();

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: "Task assigned to you",
      description: "New task 'Update documentation' was assigned to you",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Card moved",
      description: "Your card 'API Integration' was moved to 'Done'",
      time: "2 hours ago",
      read: true,
    },
    {
      id: 3,
      title: "Comment on your task",
      description: "John added a comment to 'UI Design' task",
      time: "1 day ago",
      read: true,
    },
  ];

  // Navigate to settings page
  const handleSettingsClick = () => {
    router.push("/settings");
  };

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
          {/* Notifications Menu */}
          <Menu placement="bottom-end" closeOnSelect={false}>
            <MenuButton
              as={IconButton}
              aria-label="Notifications"
              icon={
                <Box position="relative" display="inline-block">
                  <FiBell />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Badge 
                      colorScheme="red" 
                      borderRadius="full" 
                      position="absolute"
                      top="0"
                      right="0"
                      transform="translate(25%, -25%)"
                      boxSize="1.25rem"
                      fontSize="xs"
                    >
                      {notifications.filter(n => !n.read).length}
                    </Badge>
                  )}
                </Box>
              }
              variant="ghost"
              borderRadius="full"
            />
            <MenuList maxH="350px" overflowY="auto" minW="320px" p={0}>
              <Box p={3} borderBottomWidth="1px">
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold">Notifications</Text>
                  <Text fontSize="sm" color="blue.500" cursor="pointer">Mark all as read</Text>
                </Flex>
              </Box>
              {notifications.length === 0 ? (
                <Box p={4} textAlign="center">
                  <Text>No notifications</Text>
                </Box>
              ) : (
                notifications.map(notification => (
                  <Box 
                    key={notification.id} 
                    p={3} 
                    borderBottomWidth="1px"
                    bg={!notification.read ? notificationBg : undefined}
                  >
                    <Text fontWeight={!notification.read ? "bold" : "normal"}>{notification.title}</Text>
                    <Text fontSize="sm" color="gray.500" mt={1}>{notification.description}</Text>
                    <Text fontSize="xs" color="gray.500" mt={2}>{notification.time}</Text>
                  </Box>
                ))
              )}
              <Box p={2} textAlign="center">
                <Text fontSize="sm" color="blue.500" cursor="pointer">See all notifications</Text>
              </Box>
            </MenuList>
          </Menu>

          {/* Help Button */}
          <IconButton
            aria-label="Help"
            icon={<FiHelpCircle />}
            variant="ghost"
            borderRadius="full"
            onClick={onHelpOpen}
          />

          {/* Settings Button */}
          <IconButton
            aria-label="Settings"
            icon={<FiSettings />}
            variant="ghost"
            borderRadius="full"
            onClick={handleSettingsClick}
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
              <MenuItem as={NextLink} href="/settings">Profile</MenuItem>
              <MenuItem as={NextLink} href="/settings">Account Settings</MenuItem>
              <MenuItem>Sign Out</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Help Drawer */}
      <Drawer isOpen={isHelpOpen} placement="right" onClose={onHelpClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Help & Documentation</DrawerHeader>
          <DrawerBody>
            <Heading size="md" mb={4}>Welcome to TaskFlow</Heading>
            <Text mb={4}>Get started with your project management journey:</Text>
            
            <Accordion allowMultiple defaultIndex={[0]} mb={6}>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="semibold">
                      <Flex align="center">
                        <Box as={FiBookOpen} mr={2} />
                        Getting Started Guide
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <List spacing={3}>
                    <ListItem>
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      Create your first board
                    </ListItem>
                    <ListItem>
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      Add team members to collaborate
                    </ListItem>
                    <ListItem>
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      Create cards and organize them into columns
                    </ListItem>
                    <ListItem>
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      Track progress using the dashboard
                    </ListItem>
                  </List>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="semibold">
                      <Flex align="center">
                        <Box as={FiInfo} mr={2} />
                        Frequently Asked Questions
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text fontWeight="semibold" mb={1}>How do I invite team members?</Text>
                  <Text mb={3}>Go to the Team page and use the invite form to add new members.</Text>
                  
                  <Text fontWeight="semibold" mb={1}>Can I export my data?</Text>
                  <Text mb={3}>Yes, use the export option in the board menu to download your data.</Text>
                  
                  <Text fontWeight="semibold" mb={1}>How do I create custom labels?</Text>
                  <Text mb={3}>Edit a card and select "Add Label" to create or assign labels.</Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="semibold">
                      <Flex align="center">
                        <Box as={FiCode} mr={2} />
                        Keyboard Shortcuts
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Flex justify="space-between" mb={2}>
                    <Text>Add new card</Text>
                    <Text fontWeight="bold">N</Text>
                  </Flex>
                  <Flex justify="space-between" mb={2}>
                    <Text>Search</Text>
                    <Text fontWeight="bold">Ctrl + /</Text>
                  </Flex>
                  <Flex justify="space-between" mb={2}>
                    <Text>Save changes</Text>
                    <Text fontWeight="bold">Ctrl + S</Text>
                  </Flex>
                  <Flex justify="space-between" mb={2}>
                    <Text>Navigate boards</Text>
                    <Text fontWeight="bold">B</Text>
                  </Flex>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
            
            <Divider my={4} />
            
            <Box mt={4}>
              <Text fontWeight="semibold" mb={2}>Need more help?</Text>
              <Flex mt={2} gap={4}>
                <Flex 
                  direction="column" 
                  align="center" 
                  flex="1" 
                  p={3} 
                  borderRadius="md" 
                  borderWidth="1px"
                  cursor="pointer"
                  _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                >
                  <Box as={FiMessageSquare} fontSize="xl" mb={2} />
                  <Text textAlign="center" fontSize="sm">Contact Support</Text>
                </Flex>
                <Flex 
                  direction="column" 
                  align="center" 
                  flex="1" 
                  p={3} 
                  borderRadius="md" 
                  borderWidth="1px"
                  cursor="pointer"
                  _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                >
                  <Box as={FiBookOpen} fontSize="xl" mb={2} />
                  <Text textAlign="center" fontSize="sm">View Tutorials</Text>
                </Flex>
              </Flex>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
