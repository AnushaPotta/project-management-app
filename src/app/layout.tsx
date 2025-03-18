// src/app/layout.tsx
import { Providers } from "@/app/chakra-ui/providers";

export const metadata = {
  title: "Project Management App",
  description: "A Trello-like project management application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
