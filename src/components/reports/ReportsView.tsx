// src/components/reports/ReportsView.tsx
import { useState } from "react";
import {
  Box,
  Grid,
  Text,
  Flex,
  Heading,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  List,
  ListItem,
  Badge,
  HStack,
  SimpleGrid,
  Divider,
  Avatar,
} from "@chakra-ui/react";
import { 
  FiCheckCircle, 
  FiClock, 
  FiActivity, 
  FiPlus, 
  FiEdit, 
  FiMove,
  FiTrash2,
  FiStar
} from "react-icons/fi";
import { format, parseISO, differenceInDays } from "date-fns";

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
}

interface ActivityItem {
  id: string;
  type: string;
  boardId: string;
  boardTitle: string;
  userId: string;
  userName: string;
  timestamp: string;
  description: string;
}

interface DeadlineCard {
  id: string;
  title: string;
  dueDate: string;
  boardId: string;
  boardTitle: string;
  columnId: string;
  columnTitle: string;
}

interface ReportsViewProps {
  taskStats: TaskStats;
  recentActivity: ActivityItem[];
  upcomingDeadlines: DeadlineCard[];
}

export default function ReportsView({ 
  taskStats, 
  recentActivity,
  upcomingDeadlines 
}: ReportsViewProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Calculate completion percentage
  const completionPercentage = taskStats ? 
    Math.round((taskStats.completed / (taskStats.total || 1)) * 100) : 0;

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'create': return <FiPlus />;
      case 'update': return <FiEdit />;
      case 'delete': return <FiTrash2 />;
      case 'move': return <FiMove />;
      case 'complete': return <FiCheckCircle />;
      case 'star': return <FiStar />;
      default: return <FiActivity />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Calculate urgency for deadlines
  const getUrgencyColor = (dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    const daysLeft = differenceInDays(due, today);
    
    if (daysLeft < 0) return "red";
    if (daysLeft < 3) return "orange";
    if (daysLeft < 7) return "yellow";
    return "green";
  };
  
  return (
    <Box>
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Activity Log</Tab>
          <Tab>Upcoming Deadlines</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Box mb={6}>
              <Heading size="md" mb={4}>Task Statistics</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                  <CardBody>
                    <Stat>
                      <StatLabel>Total Tasks</StatLabel>
                      <StatNumber>{taskStats?.total || 0}</StatNumber>
                      <StatHelpText>Across all boards</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                  <CardBody>
                    <Stat>
                      <StatLabel>To Do</StatLabel>
                      <StatNumber>{taskStats?.todo || 0}</StatNumber>
                      <StatHelpText>
                        {taskStats ? Math.round((taskStats.todo / (taskStats.total || 1)) * 100) : 0}% of total
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                  <CardBody>
                    <Stat>
                      <StatLabel>In Progress</StatLabel>
                      <StatNumber>{taskStats?.inProgress || 0}</StatNumber>
                      <StatHelpText>
                        {taskStats ? Math.round((taskStats.inProgress / (taskStats.total || 1)) * 100) : 0}% of total
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                  <CardBody>
                    <Stat>
                      <StatLabel>Completed</StatLabel>
                      <StatNumber>{taskStats?.completed || 0}</StatNumber>
                      <StatHelpText>
                        {taskStats ? Math.round((taskStats.completed / (taskStats.total || 1)) * 100) : 0}% of total
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </Box>
            
            <Box mb={6}>
              <Heading size="md" mb={4}>Completion Progress</Heading>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
                <CardBody>
                  <Text mb={2}>{completionPercentage}% Complete</Text>
                  <Progress value={completionPercentage} colorScheme="green" borderRadius="md" size="lg" />
                  <HStack mt={4} spacing={4} justify="center">
                    <Flex align="center">
                      <Box w={3} h={3} borderRadius="full" bg="blue.400" mr={2}></Box>
                      <Text fontSize="sm">To Do</Text>
                    </Flex>
                    <Flex align="center">
                      <Box w={3} h={3} borderRadius="full" bg="yellow.400" mr={2}></Box>
                      <Text fontSize="sm">In Progress</Text>
                    </Flex>
                    <Flex align="center">
                      <Box w={3} h={3} borderRadius="full" bg="green.400" mr={2}></Box>
                      <Text fontSize="sm">Completed</Text>
                    </Flex>
                  </HStack>
                </CardBody>
              </Card>
            </Box>
          </TabPanel>
          
          <TabPanel>
            <Heading size="md" mb={4}>Recent Activity</Heading>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardBody>
                <List spacing={3}>
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <ListItem key={activity.id}>
                        <Flex align="center" mb={2}>
                          <Flex 
                            bg="blue.50" 
                            _dark={{ bg: "blue.900" }} 
                            p={2} 
                            borderRadius="full" 
                            color="blue.500"
                            mr={3}
                          >
                            {getActivityIcon(activity.type)}
                          </Flex>
                          <Box>
                            <Flex align="center">
                              <Avatar size="xs" name={activity.userName} mr={2} />
                              <Text fontWeight="bold">{activity.userName}</Text>
                            </Flex>
                            <Text>{activity.description}</Text>
                          </Box>
                          <Box ml="auto" textAlign="right">
                            <Badge colorScheme="purple">{activity.boardTitle}</Badge>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {formatDate(activity.timestamp)}
                            </Text>
                          </Box>
                        </Flex>
                        <Divider my={2} />
                      </ListItem>
                    ))
                  ) : (
                    <Text>No recent activity found.</Text>
                  )}
                </List>
              </CardBody>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Heading size="md" mb={4}>Upcoming Deadlines</Heading>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
              <CardBody>
                <List spacing={3}>
                  {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((deadline) => (
                      <ListItem key={deadline.id}>
                        <Flex align="center" justify="space-between">
                          <Flex align="center">
                            <Flex 
                              bg={`${getUrgencyColor(deadline.dueDate)}.50`} 
                              _dark={{ bg: `${getUrgencyColor(deadline.dueDate)}.900` }} 
                              p={2} 
                              borderRadius="full" 
                              color={`${getUrgencyColor(deadline.dueDate)}.500`}
                              mr={3}
                            >
                              <FiClock />
                            </Flex>
                            <Box>
                              <Text fontWeight="bold">{deadline.title}</Text>
                              <Flex align="center" mt={1}>
                                <Badge colorScheme="purple" mr={2}>{deadline.boardTitle}</Badge>
                                <Badge colorScheme="blue">{deadline.columnTitle}</Badge>
                              </Flex>
                            </Box>
                          </Flex>
                          <Box textAlign="right">
                            <Text fontWeight="bold" color={`${getUrgencyColor(deadline.dueDate)}.500`}>
                              {formatDate(deadline.dueDate)}
                            </Text>
                          </Box>
                        </Flex>
                        <Divider my={2} />
                      </ListItem>
                    ))
                  ) : (
                    <Text>No upcoming deadlines found.</Text>
                  )}
                </List>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}