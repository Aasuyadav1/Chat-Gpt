"use client";
import {
  Plus,
  Library,
  PlayCircle,
  Grid,
  Volume2,
  ChevronUp,
  ExternalLink,
  Heart,
  MessageSquareCode,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiOpenai } from "react-icons/si";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import SidebarThreads from "./sidebar-thread";
import { SearchButton } from "@/components/chat/search-button";

// Menu items for quick actions (top 3 icons when collapsed)
const quickActions = [
  {
    title: "New chat",
    icon: Plus,
    link: "/",
  },
  {
    title: "Search chats",
    icon: null, // We'll handle this separately
    component: SearchButton,
  },
];

export function AppSidebar() {
  const router = useRouter();
  return (
    <Sidebar collapsible="icon">
      <div className="flex flex-col h-full">
        <SidebarContent>
          <SidebarGroup className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 px-3 py-1 group-data-[collapsible=icon]:hidden">
                <SiOpenai className="h-7 w-7" />
              </div>
              <SidebarTrigger />
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)]">
              <SidebarGroupContent className="space-y-5 py-2">
                <SidebarMenu className="">
                  {quickActions.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        {item.component ? (
                          <item.component />
                        ) : item.link ? (
                          <Button
                            onClick={() => router.push(item.link)}
                            variant="ghost"
                            className="w-full justify-start !text-[15px] !font-light gap-2 px-3"
                          >
                            <item.icon className="!w-5 !h-5" />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className="w-full justify-start !text-[15px] !font-light gap-3 px-3"
                          >
                            <item.icon className="!w-5 !h-5" />
                            <span>{item.title}</span>
                          </Button>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
                <SidebarThreads />
              </SidebarGroupContent>
            </ScrollArea>
          </SidebarGroup>
        </SidebarContent>

        <div className="mt-auto px-2 group-data-[collapsible=icon]:hidden">
          <Link
            href="https://aasuyadav.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="ghost"
              className="flex w-full items-center gap-2 text-sm opacity-90 hover:opacity-100 transition-opacity px-2 py-1 rounded-lg"
            >
              Built by<span className="underline">Aasu</span>
              <Heart className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Sidebar>
  );
}
