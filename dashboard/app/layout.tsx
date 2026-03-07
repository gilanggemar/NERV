import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientShell } from "@/components/ClientShell";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NERV.OS",
  description: "Agent Orchestration System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased text-foreground flex min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SidebarProvider>
            <TooltipProvider>
              <DashboardSidebar />
              <main className="flex-1 px-8 py-6 pl-3 overflow-auto h-screen relative">
                <ClientShell>
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-full w-full">
                      <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
                    </div>
                  }>
                    {children}
                  </Suspense>
                </ClientShell>
              </main>
            </TooltipProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

