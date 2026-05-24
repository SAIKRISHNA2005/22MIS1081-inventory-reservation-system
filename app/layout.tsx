import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Allo Inventory",
  description: "Allo Health Inventory Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 antialiased">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
