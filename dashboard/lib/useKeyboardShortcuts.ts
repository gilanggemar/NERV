"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keyboard shortcuts:
 *   Ctrl+1~4 = Switch between agents (navigate to chat with agent param)
 *   Ctrl+S   = Summit
 *   Ctrl+T   = Toggle to console (task view)
 *   Cmd+K    = Command Palette (handled by CommandPalette component)
 */
export function useKeyboardShortcuts() {
    const router = useRouter();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Skip if user is typing in an input
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            if (e.ctrlKey && !e.shiftKey && !e.altKey) {
                switch (e.key) {
                    case "1": e.preventDefault(); router.push("/dashboard/chat?agent=daisy"); break;
                    case "2": e.preventDefault(); router.push("/dashboard/chat?agent=ivy"); break;
                    case "3": e.preventDefault(); router.push("/dashboard/chat?agent=celia"); break;
                    case "4": e.preventDefault(); router.push("/dashboard/chat?agent=thalia"); break;
                    case "s": e.preventDefault(); router.push("/dashboard/summit"); break;
                    case "t": e.preventDefault(); router.push("/dashboard/console"); break;
                }
            }
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [router]);
}
