// src/components/settings/SettingsView.tsx
import { useState, useRef } from "react";
import {
  Box,
  Text,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Avatar,
  Flex,
  Divider,
  Switch,
  Select,
  useColorMode,
  VStack,
  HStack,
  useToast,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  FiUser,
  FiMoon,
  FiSun,
  FiBell,
  FiLock,
  FiUpload,
} from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  name?: string;
}

interface SettingsViewProps {
  user: User;
}

export default function SettingsView({ user }: SettingsViewProps) {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { colorMode, toggleColorMode } = useColorMode();
  const { updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.displayName || user?.name || "",
    email: user?.email || "",
    bio: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskDueReminders: true,
    teamUpdates: true,
    systemAnnouncements: false,
  });

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Determine which tab to show based on URL param
  const getTabIndex = () => {
    switch(tabParam) {
      case 'profile': return 0;
      case 'appearance': return 1;
      case 'notifications': return 2;
      case 'account': return 3;
      case 'workspace': return 4;
      default: return 0; // Default to profile tab
    }
  };

  // Handle tab change by updating URL
  const handleTabChange = (index: number) => {
    let tab;
    switch(index) {
      case 0: tab = 'profile'; break;
      case 1: tab = 'appearance'; break;
      case 2: tab = 'notifications'; break;
      case 3: tab = 'account'; break;
      case 4: tab = 'workspace'; break;
      default: tab = 'profile';
    }
    router.push(`/settings?tab=${tab}`);
  };

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (setting: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  // Handle image selection
  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setSelectedImage(file);
    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
    
    toast({
      title: "Image selected",
      description: "Click Save Changes to update your profile",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Update Firebase Auth profile
      await updateProfile({
        displayName: profileForm.name,
        photoURL: imagePreview || user?.photoURL,
      });
      
      toast({
        title: "Profile updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: "Please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Here you would update notification settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Notification settings updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error updating notification settings",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Tabs 
        colorScheme="blue" 
        variant="enclosed" 
        index={getTabIndex()} 
        onChange={handleTabChange}
      >
        <TabList>
          <Tab><Flex align="center"><Box as={FiUser} mr={2} />Profile</Flex></Tab>
          <Tab><Flex align="center"><Box as={colorMode === 'dark' ? FiSun : FiMoon} mr={2} />Appearance</Flex></Tab>
          <Tab><Flex align="center"><Box as={FiBell} mr={2} />Notifications</Flex></Tab>
          <Tab><Flex align="center"><Box as={FiLock} mr={2} />Account</Flex></Tab>
          <Tab><Flex align="center"><Box as={FiLock} mr={2} />Workspace</Flex></Tab>
        </TabList>

        <TabPanels>
          {/* Profile Tab */}
          <TabPanel>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardHeader>
                <Heading size="md">Your Profile</Heading>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleProfileSubmit}>
                  <Flex 
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "center", md: "start" }}
                    mb={6}
                  >
                    <Avatar 
                      size="xl" 
                      name={profileForm.name} 
                      src={imagePreview || user?.photoURL} 
                      mb={{ base: 4, md: 0 }}
                      mr={{ md: 6 }}
                    />
                    <Box textAlign={{ base: "center", md: "left" }}>
                      <Heading size="sm" mb={2}>Profile Picture</Heading>
                      <Text mb={3} color="gray.500">Upload a new profile picture</Text>
                      <Button leftIcon={<FiUpload />} size="sm" onClick={handleImageSelect}>
                        Upload Image
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                      />
                    </Box>
                  </Flex>
                  
                  <Divider mb={6} />
                  
                  <Stack spacing={4}>
                    <FormControl id="name">
                      <FormLabel>Name</FormLabel>
                      <Input 
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        placeholder="Your name"
                      />
                    </FormControl>
                    
                    <FormControl id="email">
                      <FormLabel>Email</FormLabel>
                      <Input 
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        isReadOnly
                        bg="gray.50"
                        _dark={{ bg: "gray.700" }}
                      />
                    </FormControl>
                    
                    <FormControl id="bio">
                      <FormLabel>Bio</FormLabel>
                      <Input 
                        name="bio"
                        value={profileForm.bio}
                        onChange={handleProfileChange}
                        placeholder="Tell us about yourself"
                      />
                    </FormControl>
                    
                    <Button 
                      colorScheme="blue" 
                      type="submit"
                      isLoading={isSubmitting}
                      alignSelf="flex-start"
                      mt={4}
                    >
                      Save Changes
                    </Button>
                  </Stack>
                </form>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Appearance Tab */}
          <TabPanel>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardHeader>
                <Heading size="md">Appearance Settings</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={4}>Theme</Heading>
                    <HStack>
                      <Button 
                        leftIcon={<FiSun />} 
                        variant={colorMode === 'light' ? 'solid' : 'outline'}
                        colorScheme="blue"
                        onClick={() => colorMode !== 'light' && toggleColorMode()}
                      >
                        Light
                      </Button>
                      <Button 
                        leftIcon={<FiMoon />} 
                        variant={colorMode === 'dark' ? 'solid' : 'outline'}
                        colorScheme="blue"
                        onClick={() => colorMode !== 'dark' && toggleColorMode()}
                      >
                        Dark
                      </Button>
                    </HStack>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Heading size="sm" mb={4}>Dashboard Layout</Heading>
                    <FormControl display="flex" alignItems="center" mb={4}>
                      <FormLabel htmlFor="compact-view" mb="0">
                        Compact View
                      </FormLabel>
                      <Switch id="compact-view" colorScheme="blue" />
                    </FormControl>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Heading size="sm" mb={4}>Language</Heading>
                    <Select defaultValue="en">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </Select>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Notifications Tab */}
          <TabPanel>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardHeader>
                <Heading size="md">Notification Preferences</Heading>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleNotificationSubmit}>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="email-notifications" mb="0">
                        Email Notifications
                      </FormLabel>
                      <Switch 
                        id="email-notifications" 
                        isChecked={notificationSettings.emailNotifications}
                        onChange={() => handleNotificationChange('emailNotifications')}
                        colorScheme="blue" 
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="task-reminders" mb="0">
                        Task Due Date Reminders
                      </FormLabel>
                      <Switch 
                        id="task-reminders" 
                        isChecked={notificationSettings.taskDueReminders}
                        onChange={() => handleNotificationChange('taskDueReminders')}
                        colorScheme="blue" 
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="team-updates" mb="0">
                        Team Updates
                      </FormLabel>
                      <Switch 
                        id="team-updates" 
                        isChecked={notificationSettings.teamUpdates}
                        onChange={() => handleNotificationChange('teamUpdates')}
                        colorScheme="blue" 
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="system-announcements" mb="0">
                        System Announcements
                      </FormLabel>
                      <Switch 
                        id="system-announcements" 
                        isChecked={notificationSettings.systemAnnouncements}
                        onChange={() => handleNotificationChange('systemAnnouncements')}
                        colorScheme="blue" 
                      />
                    </FormControl>
                    
                    <Button 
                      colorScheme="blue" 
                      type="submit"
                      isLoading={isSubmitting}
                      alignSelf="flex-start"
                      mt={4}
                    >
                      Save Preferences
                    </Button>
                  </VStack>
                </form>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Account Tab */}
          <TabPanel>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardHeader>
                <Heading size="md">Account Settings</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={4}>Password</Heading>
                    <Button colorScheme="blue">Change Password</Button>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Heading size="sm" mb={4}>Two-Factor Authentication</Heading>
                    <FormControl display="flex" alignItems="center" mb={4}>
                      <FormLabel htmlFor="2fa" mb="0">
                        Enable 2FA
                      </FormLabel>
                      <Switch id="2fa" colorScheme="blue" />
                    </FormControl>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Heading size="sm" color="red.500" mb={4}>Danger Zone</Heading>
                    <Button colorScheme="red" variant="outline">Delete Account</Button>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Workspace Tab */}
          <TabPanel>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardHeader>
                <Heading size="md">Workspace Settings</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={4}>Workspace Name</Heading>
                    <Input placeholder="Enter workspace name" />
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Heading size="sm" mb={4}>Workspace Description</Heading>
                    <Input placeholder="Enter workspace description" />
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}