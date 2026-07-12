import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Portfolio Manager",
  description: "Gold and investment portfolio management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        geistSans.variable,
        geistMono.variable,
        fraunces.variable,
        "dark h-full antialiased",
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
            {children}
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
