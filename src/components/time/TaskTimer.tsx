// src/components/time/TaskTimer.tsx
import { useState, useEffect } from "react";
import { Button, Text, HStack, Box, useToast } from "@chakra-ui/react";
import { FiPlay, FiPause, FiSave } from "react-icons/fi";

interface TimerProps {
  taskId: string;
  onLogTime: (taskId: string, seconds: number) => Promise<void>;
}

export default function TaskTimer({ taskId, onLogTime }: TimerProps) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [savedTime, setSavedTime] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (running) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [running]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    try {
      await onLogTime(taskId, seconds);
      setSavedTime((prev) => prev + seconds);
      setSeconds(0);
      setRunning(false);

      toast({
        title: "Time logged",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Failed to log time",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box p={3} borderWidth="1px" borderRadius="md">
      <Text mb={2}>Time tracked: {formatTime(savedTime)}</Text>
      <Text fontSize="2xl" fontFamily="mono" mb={3}>
        {formatTime(seconds)}
      </Text>
      <HStack>
        <Button
          leftIcon={running ? <FiPause /> : <FiPlay />}
          onClick={() => setRunning(!running)}
          colorScheme={running ? "red" : "green"}
          size="sm"
        >
          {running ? "Pause" : "Start"}
        </Button>
        <Button
          leftIcon={<FiSave />}
          onClick={handleSave}
          isDisabled={seconds === 0}
          size="sm"
        >
          Save
        </Button>
      </HStack>
    </Box>
  );
}
