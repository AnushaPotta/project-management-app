// src/components/calendar/CalendarView.tsx
import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Grid,
  Text,
  Flex,
  Button,
  Badge,
  useColorModeValue,
  Heading,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  title: string;
  dueDate: string;
  boardId: string;
  boardTitle: string;
  columnId: string;
  columnTitle: string;
}

interface CalendarViewProps {
  tasks: Task[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const todayBg = useColorModeValue("blue.50", "blue.900");
  const dayBg = useColorModeValue("gray.50", "gray.700");
  
  // Use breakpoint value to handle responsive design without causing hydration errors
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Set mounted state to avoid hydration errors with window object
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Days of the week header
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Calculate calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Start from the first day of the week
    const startDay = new Date(monthStart);
    startDay.setDate(startDay.getDate() - startDay.getDay());
    
    // End on the last day of the week
    const endDay = new Date(monthEnd);
    const daysToAdd = 6 - endDay.getDay();
    endDay.setDate(endDay.getDate() + daysToAdd);
    
    return eachDayOfInterval({ start: startDay, end: endDay });
  }, [currentMonth]);
  
  // Helper function to get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return isSameDay(day, taskDate);
    });
  };
  
  // Navigate to previous/next month
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const today = () => setCurrentMonth(new Date());
  
  const handleTaskClick = (task: Task) => {
    router.push(`/boards/${task.boardId}`);
  };
  
  return (
    <Box borderWidth="1px" borderRadius="lg" bg={bgColor} p={{ base: 2, md: 4 }}>
      {/* Calendar header with month navigation - mobile optimized */}
      <Flex 
        justify="space-between" 
        align="center" 
        mb={{ base: 3, md: 6 }}
        flexDir={{ base: "column", sm: "row" }}
        gap={{ base: 2, sm: 0 }}
      >
        {/* Month title and Today button */}
        <Flex 
          justifyContent="center" 
          alignItems="center" 
          width="100%"
          order={{ base: 1, sm: 2 }}
          mb={{ base: 2, sm: 0 }}
        >
          <Heading size={{ base: "sm", md: "md" }} textAlign="center">
            {format(currentMonth, "MMMM yyyy")}
          </Heading>
          <Button ml={4} size="sm" onClick={today} colorScheme="blue" variant="outline">
            Today
          </Button>
        </Flex>
        
        {/* Month navigation buttons */}
        <Flex 
          width="100%" 
          justify="space-between"
          order={{ base: 2, sm: 1 }}
        >
          <Button leftIcon={<FiChevronLeft />} onClick={prevMonth} size="sm" width={{ base: "45%", sm: "auto" }}>
            Previous
          </Button>
          <Button rightIcon={<FiChevronRight />} onClick={nextMonth} size="sm" width={{ base: "45%", sm: "auto" }}>
            Next
          </Button>
        </Flex>
      </Flex>
      
      {/* Days of the week header - abbreviate on mobile */}
      <Grid templateColumns="repeat(7, 1fr)" mb={2}>
        {daysOfWeek.map(day => (
          <Box key={day} textAlign="center" fontWeight="bold" py={2}>
            <Text display={{ base: "none", sm: "block" }}>{day}</Text>
            <Text display={{ base: "block", sm: "none" }}>{day.charAt(0)}</Text>
          </Box>
        ))}
      </Grid>
      
      {/* Calendar grid - with responsive cell heights */}
      <Grid templateColumns="repeat(7, 1fr)" gap={{ base: 0.5, md: 1 }}>
        {calendarDays.map(day => {
          const tasksForDay = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <Box 
              key={day.toISOString()} 
              bg={isToday ? todayBg : dayBg}
              opacity={isCurrentMonth ? 1 : 0.5}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              p={{ base: 1, md: 2 }}
              minH={{ base: "80px", sm: "90px", md: "100px" }}
              maxH={{ base: "100px", md: "150px" }}
              position="relative"
              overflow="hidden"
            >
              <Text 
                fontWeight={isToday ? "bold" : "normal"}
                textAlign="center"
                mb={{ base: 1, md: 2 }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                {format(day, "d")}
              </Text>
              
              {/* Tasks for the day */}
              <Flex direction="column" gap={1}>
                {tasksForDay.map(task => (
                  <Box 
                    key={task.id}
                    bg="blue.100" 
                    color="blue.800"
                    p={{ base: 0.5, md: 1 }}
                    borderRadius="md"
                    fontSize={{ base: "2xs", md: "xs" }}
                    cursor="pointer"
                    onClick={() => handleTaskClick(task)}
                    _hover={{ bg: "blue.200" }}
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    mb={0.5}
                  >
                    <Text fontWeight="medium" fontSize={{ base: "2xs", md: "xs" }} noOfLines={1}>{task.title}</Text>
                    <Badge size="sm" colorScheme="gray" fontSize={{ base: "2xs", md: "xs" }} display={{ base: tasksForDay.length > 2 ? "none" : "inline-flex", md: "inline-flex" }}>
                      {task.boardTitle}
                    </Badge>
                  </Box>
                ))}
                
                {/* Show 'more' indicator if there are too many tasks - reduce threshold on mobile */}
                {isMounted && ((tasksForDay.length > 2 && isMobile) || (tasksForDay.length > 3 && !isMobile)) && (
                  <Text fontSize={{ base: "2xs", md: "xs" }} textAlign="center" mt={0.5} color="blue.500" fontWeight="medium">
                    +{tasksForDay.length - (isMobile ? 2 : 3)} more
                  </Text>
                )}
              </Flex>
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
}