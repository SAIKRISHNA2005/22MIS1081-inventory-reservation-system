import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <Providers>
          <header className="sticky top-0 border-b bg-white">
            <div className="container mx-auto flex h-16 items-center px-4">
              <h1 className="text-xl font-semibold">Allo Inventory</h1>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
