// src/app/layout.tsx
import { Providers } from "@/app/chakra-ui/providers";
import { ColorModeScript } from "@chakra-ui/react";
import { theme } from "@/theme";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
