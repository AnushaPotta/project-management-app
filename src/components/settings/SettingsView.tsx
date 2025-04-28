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
  Progress,
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      description: "Click Upload Image to update your profile",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Cloudinary implementation with correct credentials
  const handleImageUpdate = () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Start spinner
    setIsUploadingImage(true);
    
    // IMPORTANT: Save current image preview to preserve it
    const currentPreview = imagePreview;
    
    // Create form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', selectedImage);
    formData.append('upload_preset', 'Poject_management'); // Your specified upload preset
    
    // Use your actual Cloudinary cloud name
    const cloudName = "dc7wuxc6x";
    
    console.log("Uploading to Cloudinary...");
    
    // Upload to Cloudinary
    fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
      })
      .then(data => {
        console.log("Cloudinary upload successful:", data);
        
        // Get secure URL from response
        const imageUrl = data.secure_url;
        
        // Update Firebase Auth profile with Cloudinary URL
        return updateProfile({ photoURL: imageUrl });
      })
      .then(() => {
        console.log("Profile updated with new image URL");
        
        // Show success message
        toast({
          title: "Success!",
          description: "Your profile image has been updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // CRITICAL: Preserve image preview
        if (currentPreview) {
          setImagePreview(currentPreview);
        }
        
        // Reload page after delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      })
      .catch(error => {
        console.error("Error:", error);
        
        toast({
          title: "Upload Failed",
          description: "Could not update profile image",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        
        // Preserve image preview on error too
        if (currentPreview) {
          setImagePreview(currentPreview);
        }
      })
      .finally(() => {
        // Stop spinner
        setIsUploadingImage(false);
      });
    
    // Safety timeout
    setTimeout(() => {
      setIsUploadingImage(false);
      
      // Extra safety to preserve image preview
      if (currentPreview) {
        setImagePreview(currentPreview);
      }
    }, 10000);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Update the display name in Firebase Auth
    updateProfile({
      displayName: profileForm.name,
    })
    .then(() => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    })
    .catch((error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    })
    .finally(() => {
      // Always ensure the button stops spinning
      setIsSubmitting(false);
    });
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
                  <Stack spacing={6}>
                    <Flex direction={{ base: "column", md: "row" }} gap={6}>
                      <Box flex="1">
                        <FormControl id="name" mb={4}>
                          <FormLabel>Name</FormLabel>
                          <Input 
                            name="name" 
                            value={profileForm.name} 
                            onChange={handleProfileChange} 
                          />
                        </FormControl>
                        
                        <FormControl id="email" mb={4}>
                          <FormLabel>Email</FormLabel>
                          <Input 
                            name="email" 
                            value={profileForm.email} 
                            isReadOnly
                            bg={useColorModeValue("gray.50", "gray.900")}
                          />
                        </FormControl>
                        
                        <Button 
                          colorScheme="blue" 
                          type="submit"
                          isLoading={isSubmitting}
                          alignSelf="flex-start"
                        >
                          Update Profile
                        </Button>
                      </Box>
                      
                      <Box textAlign={{ base: "center", md: "left" }}>
                        <Heading size="sm" mb={2}>Profile Picture</Heading>
                        <Text mb={3} color="gray.500">Upload a new profile picture</Text>
                        
                        <Avatar 
                          size="xl" 
                          mb={4}
                          src={imagePreview || user?.photoURL || undefined}
                          name={user?.displayName || ""}
                        />
                        
                        <VStack spacing={2} align="stretch">
                          <Button 
                            leftIcon={<FiUpload />} 
                            onClick={handleImageSelect}
                            size="sm"
                          >
                            Select Image
                          </Button>
                          
                          {selectedImage && (
                            <Button 
                              colorScheme="blue" 
                              onClick={handleImageUpdate}
                              isLoading={isUploadingImage}
                              size="sm"
                            >
                              Upload Image
                            </Button>
                          )}
                        </VStack>
                        
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          style={{ display: 'none' }} 
                        />
                      </Box>
                    </Flex>
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