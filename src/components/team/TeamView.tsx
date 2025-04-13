// src/components/team/TeamView.tsx
import {
  Box,
  Grid,
  Text,
  Flex,
  Avatar,
  Badge,
  Heading,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stack,
} from "@chakra-ui/react";

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface Board {
  id: string;
  title: string;
  members: Member[];
}

interface TeamViewProps {
  teamMembers: Member[];
  boardsWithMembers: Board[];
}

export default function TeamView({ teamMembers, boardsWithMembers }: TeamViewProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box>
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Team Members</Tab>
          <Tab>Boards & Assignments</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Heading size="md" mb={4}>All Team Members ({teamMembers.length})</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {teamMembers.map((member) => (
                <Card key={member.id} bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                  <CardHeader>
                    <Flex align="center">
                      <Avatar size="md" name={member.name} src={member.avatar} mr={3} />
                      <Box>
                        <Text fontWeight="bold">{member.name}</Text>
                        <Text fontSize="sm" color="gray.500">{member.email}</Text>
                      </Box>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Flex justify="space-between" align="center">
                      <Badge colorScheme={member.role === "ADMIN" ? "purple" : "blue"}>
                        {member.role || "Member"}
                      </Badge>
                      <Text fontSize="sm">
                        {boardsWithMembers.filter(board => 
                          board.members.some(m => m.id === member.id)
                        ).length} Projects
                      </Text>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>
          
          <TabPanel>
            <Heading size="md" mb={4}>Project Assignments</Heading>
            <Stack spacing={4}>
              {boardsWithMembers.map((board) => (
                <Card key={board.id} bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                  <CardHeader>
                    <Heading size="md">{board.title}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text mb={3}>Team Members ({board.members.length})</Text>
                    <Flex flexWrap="wrap" gap={2}>
                      {board.members.map((member) => (
                        <Flex 
                          key={`${board.id}-${member.id}`} 
                          align="center" 
                          bg="gray.100" 
                          _dark={{ bg: "gray.700" }} 
                          borderRadius="md" 
                          p={2}
                        >
                          <Avatar size="xs" name={member.name} src={member.avatar} mr={2} />
                          <Text fontSize="sm">{member.name}</Text>
                        </Flex>
                      ))}
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}