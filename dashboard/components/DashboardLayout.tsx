"use client";

import { Suspense } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientShell } from "@/components/ClientShell";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
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
    );
}
