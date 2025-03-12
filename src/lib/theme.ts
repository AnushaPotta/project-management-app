// src/lib/theme.ts
import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  colors: {
    brand: {
      50: "#e3f2fd",
      100: "#bbdefb",
      500: "#2196f3",
      600: "#1e88e5",
      700: "#1976d2",
    },
  },
  styles: {
    global: {
      body: {
        bg: "gray.50",
      },
    },
  },
});
