"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import Image from "next/image";
import { FiCheckCircle, FiUsers, FiClock, FiTrello } from "react-icons/fi";
import { IconType } from "react-icons";
import { useAuth } from "@/contexts/auth-context";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useRouter } from "next/navigation";

// Feature component with proper typing
interface FeatureProps {
  icon: IconType;
  title: string;
  description: string;
}

const Feature = ({ icon, title, description }: FeatureProps) => {
  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");

  return (
    <VStack
      align="flex-start"
      p={6}
      bg={bgColor}
      rounded="lg"
      shadow="md"
      transition="all 0.3s"
      _hover={{ transform: "translateY(-5px)", shadow: "lg" }}
    >
      <Icon as={icon} w={6} h={6} color="blue.500" />
      <Text fontWeight="bold" fontSize="lg">
        {title}
      </Text>
      <Text color={textColor}>{description}</Text>
    </VStack>
  );
};

// Features data
const features: FeatureProps[] = [
  {
    icon: FiCheckCircle,
    title: "Easy Task Management",
    description:
      "Create, organize, and track tasks with intuitive drag-and-drop interfaces",
  },
  {
    icon: FiUsers,
    title: "Team Collaboration",
    description:
      "Work together seamlessly with real-time updates and notifications",
  },
  {
    icon: FiClock,
    title: "Time Tracking",
    description: "Monitor project progress and team productivity effectively",
  },
  {
    icon: FiTrello,
    title: "Customizable Boards",
    description:
      "Adapt boards to your workflow with flexible customization options",
  },
];

export default function Home() {
  return (
    <AuthenticatedLayout>
      <HomeContent />
    </AuthenticatedLayout>
  );
}

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const ctaBgColor = useColorModeValue("blue.500", "blue.600");
  const sectionBgColor = useColorModeValue("gray.50", "gray.800");

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/register");
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Container maxW="container.xl" py={20}>
        <Flex direction={{ base: "column", md: "row" }} align="center" gap={10}>
          <VStack spacing={6} align="flex-start" flex={1}>
            <Heading
              as="h1"
              size="2xl"
              bgGradient="linear(to-r, blue.400, blue.600)"
              bgClip="text"
            >
              Manage your projects with ease
            </Heading>
            <Text
              fontSize="xl"
              color={useColorModeValue("gray.600", "gray.300")}
            >
              TaskFlow helps teams move work forward by organizing projects,
              tracking progress, and collaborating effectively.
            </Text>
            <Button
              size="lg"
              colorScheme="blue"
              onClick={handleGetStarted}
              px={8}
            >
              {user ? "Go to Dashboard" : "Get Started - It's Free"}
            </Button>
          </VStack>

         <Box 
  borderRadius="md" 
  overflow="hidden" 
  boxShadow="lg" 
  my={8}
  transition="transform 0.3s, box-shadow 0.3s"
  _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl' }}
>
  <Image 
    src="/images/dashboard-preview.png" 
    alt="TaskFlow Dashboard Preview" 
    width={800}
    height={450}
    style={{ width: '100%', height: 'auto' }}
  />
</Box> 
        </Flex>
      </Container>

      {/* Features Section */}
      <Box bg={sectionBgColor} py={20}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl">Why Choose TaskFlow?</Heading>
              <Text
                color={useColorModeValue("gray.600", "gray.300")}
                fontSize="lg"
                maxW="container.md"
              >
                Streamline your workflow with powerful features designed to
                enhance productivity
              </Text>
            </VStack>

            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 4 }}
              spacing={8}
              width="full"
            >
              {features.map((feature, index) => (
                <Feature
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={20}>
        <Container maxW="container.xl">
          <Flex
            direction={{ base: "column", md: "row" }}
            align="center"
            justify="space-between"
            bg={ctaBgColor}
            p={10}
            rounded="2xl"
            color="white"
          >
            <VStack align="flex-start" spacing={4}>
              <Heading size="lg">Ready to get started?</Heading>
              <Text fontSize="lg">
                Join thousands of teams already using TaskFlow to improve their
                productivity
              </Text>
            </VStack>
            <Button
              size="lg"
              colorScheme="white"
              variant="outline"
              _hover={{ bg: "white", color: "blue.500" }}
              onClick={handleGetStarted}
              mt={{ base: 6, md: 0 }}
            >
              {user ? "Go to Dashboard" : "Start for Free"}
            </Button>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
