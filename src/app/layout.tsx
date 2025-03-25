import Providers from "@/components/Providers";
import ApolloClientProvider from "@/components/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ApolloClientProvider>
          <Providers>{children}</Providers>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
