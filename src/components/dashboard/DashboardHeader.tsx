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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverFooter,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { FiSearch, FiBell, FiHelpCircle, FiSettings, FiCheckCircle, FiInfo, FiBookOpen, FiCode, FiMessageSquare, FiFile, FiCheck } from "react-icons/fi";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { SEARCH_QUERY } from "@/graphql/search";

export default function DashboardHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const bgColor = useColorModeValue("white", "gray.800");
  const notificationBg = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  
  const [executeSearch, { loading: isSearching, data: searchData }] = useLazyQuery(
    SEARCH_QUERY, 
    { fetchPolicy: "network-only" }
  );
  
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
  
  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      onSearchOpen();
      executeSearch({ variables: { query } });
    } else {
      onSearchClose();
    }
  };
  
  // Focus search input with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ or Command+/ shortcut for search
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Navigate to search result
  const handleSearchResultClick = (path: string) => {
    router.push(path);
    setSearchQuery("");
    onSearchClose();
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
        <Popover
          isOpen={isSearchOpen && searchQuery.length > 2}
          onClose={onSearchClose}
          placement="bottom-start"
          autoFocus={false}
          closeOnBlur={true}
          gutter={4}
        >
          <PopoverTrigger>
            <InputGroup maxW="400px">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input 
                placeholder="Search boards and tasks... (Ctrl+/)" 
                borderRadius="full"
                value={searchQuery}
                onChange={handleSearchChange}
                ref={searchRef}
              />
            </InputGroup>
          </PopoverTrigger>
          <PopoverContent 
            w="400px" 
            maxH="400px" 
            overflowY="auto" 
            shadow="lg"
            borderRadius="md"
          >
            <PopoverHeader fontWeight="semibold" borderBottomWidth="1px">
              {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
            </PopoverHeader>
            <PopoverBody p={0}>
              {isSearching ? (
                <Flex py={4} justify="center" align="center">
                  <Spinner size="sm" mr={2} />
                  <Text>Searching...</Text>
                </Flex>
              ) : searchData && searchData.search.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Text>No results found</Text>
                </Box>
              ) : searchData && (
                <VStack align="stretch" spacing={0} divider={<Divider />}>
                  {searchData.search.map(result => (
                    <Box 
                      key={`${result.type}-${result.id}`}
                      p={3}
                      cursor="pointer"
                      _hover={{ bg: hoverBg }}
                      onClick={() => handleSearchResultClick(
                        result.type === 'board' 
                          ? `/boards/${result.id}` 
                          : `/boards/${result.boardId}?task=${result.id}`
                      )}
                    >
                      <Flex align="center">
                        <Box 
                          as={result.type === 'board' ? FiFile : FiCheck} 
                          mr={3}
                          color={result.type === 'board' ? 'blue.500' : 'green.500'}
                        />
                        <Box>
                          <Text fontWeight="medium">{result.title}</Text>
                          {result.type === 'task' && (
                            <Text fontSize="sm" color="gray.500">
                              {result.boardTitle} • {result.columnTitle}
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              )}
            </PopoverBody>
            {searchData && searchData.search.length > 0 && (
              <PopoverFooter borderTopWidth="1px" fontSize="sm" py={2} textAlign="center">
                <Text color="gray.500">Press Enter to see all results</Text>
              </PopoverFooter>
            )}
          </PopoverContent>
        </Popover>

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
                    cursor="pointer"
                    _hover={{ bg: notificationBg }}
                  >
                    <Text fontWeight={!notification.read ? "bold" : "normal"}>{notification.title}</Text>
                    <Text fontSize="sm" color="gray.600" mt={1}>{notification.description}</Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>{notification.time}</Text>
                  </Box>
                ))
              )}
              <Box p={3} textAlign="center">
                <Text fontSize="sm" color="blue.500" cursor="pointer">View all notifications</Text>
              </Box>
            </MenuList>
          </Menu>

          {/* Help Menu */}
          <IconButton
            aria-label="Help"
            icon={<FiHelpCircle />}
            variant="ghost"
            borderRadius="full"
            onClick={onHelpOpen}
          />

          {/* Settings */}
          <IconButton
            aria-label="Settings"
            icon={<FiSettings />}
            variant="ghost"
            borderRadius="full"
            onClick={handleSettingsClick}
          />

          {/* User Menu */}
          <Menu>
            <MenuButton as={Avatar} size="sm" name={user?.displayName || ""} src={user?.photoURL || ""} cursor="pointer" />
            <MenuList>
              <MenuItem onClick={() => router.push('/settings?tab=profile')}>Profile</MenuItem>
              <MenuItem onClick={() => router.push('/settings?tab=appearance')}>Appearance</MenuItem>
              <MenuItem onClick={() => router.push("/settings")}>Settings</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Help Drawer */}
      <Drawer
        isOpen={isHelpOpen}
        placement="right"
        onClose={onHelpClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Heading size="md">Help & Documentation</Heading>
          </DrawerHeader>
          <DrawerBody>
            <Heading size="sm" mb={4}>Getting Started</Heading>
            <Accordion allowToggle defaultIndex={[0]}>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="semibold">
                      <Flex align="center">
                        <Box as={FiCheckCircle} mr={2} />
                        Quick Start Guide
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <List spacing={3}>
                    <ListItem>
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      Create a new board from the dashboard
                    </ListItem>
                    <ListItem>
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      Add columns and tasks to your board
                    </ListItem>
                    <ListItem>
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      Drag and drop to organize your tasks
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
