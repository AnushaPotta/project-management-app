// src/app/chakra-ui/theme.ts
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  // Your theme customizations here
  colors: {
    brand: {
      50: "#e0f7fa",
      100: "#b2ebf2",
      200: "#80deea",
      300: "#4dd0e1",
      400: "#26c6da",
      500: "#00bcd4", // Primary brand color
      600: "#00acc1",
      700: "#0097a7",
      800: "#00838f",
      900: "#006064",
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  components: {
    Button: {
      // Custom styles for Button
      baseStyle: {
        fontWeight: "bold",
        borderRadius: "md",
      },
      variants: {
        primary: {
          bg: "brand.500",
          color: "white",
          _hover: {
            bg: "brand.600",
          },
        },
      },
    },
    Card: {
      baseStyle: {
        p: "6",
        borderRadius: "lg",
        boxShadow: "md",
      },
    },
  },
  styles: {
    global: {
      // Global styles
      body: {
        bg: "gray.50",
        color: "gray.800",
      },
    },
  },
});

export default theme;
