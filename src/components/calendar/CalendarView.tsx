// src/components/calendar/CalendarView.tsx
import { useState, useMemo } from "react";
import {
  Box,
  Grid,
  Text,
  Flex,
  Button,
  Badge,
  useColorModeValue,
  Heading,
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
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const todayBg = useColorModeValue("blue.50", "blue.900");
  const dayBg = useColorModeValue("gray.50", "gray.700");
  
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
    <Box borderWidth="1px" borderRadius="lg" bg={bgColor} p={4}>
      {/* Calendar header with month navigation */}
      <Flex justify="space-between" align="center" mb={6}>
        <Button leftIcon={<FiChevronLeft />} onClick={prevMonth} size="sm">
          Previous
        </Button>
        
        <Flex>
          <Heading size="md">
            {format(currentMonth, "MMMM yyyy")}
          </Heading>
          <Button ml={4} size="sm" onClick={today}>
            Today
          </Button>
        </Flex>
        
        <Button rightIcon={<FiChevronRight />} onClick={nextMonth} size="sm">
          Next
        </Button>
      </Flex>
      
      {/* Days of the week header */}
      <Grid templateColumns="repeat(7, 1fr)" mb={2}>
        {daysOfWeek.map(day => (
          <Box key={day} textAlign="center" fontWeight="bold" py={2}>
            {day}
          </Box>
        ))}
      </Grid>
      
      {/* Calendar grid */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
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
              p={2}
              minH="100px"
              position="relative"
            >
              <Text 
                fontWeight={isToday ? "bold" : "normal"}
                textAlign="center"
                mb={2}
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
                    p={1}
                    borderRadius="md"
                    fontSize="xs"
                    cursor="pointer"
                    onClick={() => handleTaskClick(task)}
                    _hover={{ bg: "blue.200" }}
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    <Text fontWeight="medium">{task.title}</Text>
                    <Badge size="sm" colorScheme="gray">
                      {task.boardTitle}
                    </Badge>
                  </Box>
                ))}
                
                {tasksForDay.length > 3 && (
                  <Text fontSize="xs" textAlign="center" mt={1}>
                    +{tasksForDay.length - 3} more
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