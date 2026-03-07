"use client";

import { Bell } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NotificationsPopover({ notifications }: { notifications: any[] }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <SidebarMenuButton size="default" className="relative group/notification h-8 w-8">
                    <Bell className="size-4" />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 flex size-2 bg-red-500 rounded-full" />
                    )}
                </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex flex-col gap-2 p-4 pt-4 pb-2">
                    <h4 className="font-medium text-sm">Notifications</h4>
                </div>
                <div className="flex flex-col">
                    {notifications.map((n) => (
                        <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors border-t border-border/50">
                            <Avatar className="h-8 w-8 mt-0.5">
                                <AvatarImage src={n.avatar} />
                                <AvatarFallback>{n.fallback}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{n.text}</span>
                                <span className="text-xs text-muted-foreground">{n.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
