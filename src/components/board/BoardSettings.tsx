// src/components/board/BoardSettings.tsx
import {
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  HStack,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";

interface BoardSettingsProps {
  initialColumns: { id: string; title: string }[];
  onSave: (columns: { id: string; title: string }[]) => Promise<void>;
}

export default function BoardSettings({
  initialColumns,
  onSave,
}: BoardSettingsProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const addColumn = () => {
    setColumns([...columns, { id: `col-${Date.now()}`, title: "" }]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumnTitle = (index: number, title: string) => {
    const newColumns = [...columns];
    newColumns[index].title = title;
    setColumns(newColumns);
  };

  const moveColumn = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === columns.length - 1)
    ) {
      return;
    }

    const newColumns = [...columns];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    [newColumns[index], newColumns[targetIndex]] = [
      newColumns[targetIndex],
      newColumns[index],
    ];

    setColumns(newColumns);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(columns);
      toast({
        title: "Board updated",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Failed to update board",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Board Columns</Heading>

      {columns.map((column, index) => (
        <HStack key={column.id}>
          <FormControl>
            <FormLabel srOnly>Column Title</FormLabel>
            <Input
              value={column.title}
              onChange={(e) => updateColumnTitle(index, e.target.value)}
              placeholder="Column name"
            />
          </FormControl>

          <IconButton
            icon={<FiArrowUp />}
            aria-label="Move up"
            onClick={() => moveColumn(index, "up")}
            isDisabled={index === 0}
            size="sm"
          />

          <IconButton
            icon={<FiArrowDown />}
            aria-label="Move down"
            onClick={() => moveColumn(index, "down")}
            isDisabled={index === columns.length - 1}
            size="sm"
          />

          <IconButton
            icon={<FiTrash2 />}
            aria-label="Remove column"
            onClick={() => removeColumn(index)}
            colorScheme="red"
            size="sm"
          />
        </HStack>
      ))}

      <HStack>
        <Button leftIcon={<FiPlus />} onClick={addColumn}>
          Add Column
        </Button>

        <Button
          colorScheme="blue"
          onClick={handleSave}
          isLoading={isLoading}
          isDisabled={columns.some((col) => !col.title.trim())}
        >
          Save Changes
        </Button>
      </HStack>
    </VStack>
  );
}
