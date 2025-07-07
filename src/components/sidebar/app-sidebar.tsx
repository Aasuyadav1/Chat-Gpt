import {
  Plus,
  Library,
  PlayCircle,
  Grid,
  Bot,
  Volume2,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

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
    link: "/chat",
  },
  {
    title: "Search chats",
    icon: null, // We'll handle this separately
    component: SearchButton,
  },
  {
    title: "Library",
    icon: Library,
  },
];

// Menu items for features
const features = [
  {
    title: "Sora",
    icon: PlayCircle,
  },
  {
    title: "GPTs",
    icon: Grid,
  },
  {
    title: "Voice Over Generator",
    icon: Volume2,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <div className="flex flex-col h-full">
        <SidebarContent>
          <SidebarGroup className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 px-3 py-1 group-data-[collapsible=icon]:hidden">
                <Bot className="h-7 w-7" />
              </div>
              <SidebarTrigger />
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)]">
              <SidebarGroupContent className="space-y-5 py-2">
                {/* Quick Actions - Always visible, top 3 icons when collapsed */}
                <SidebarMenu className="">
                  {quickActions.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        {item.component ? (
                          <item.component />
                        ) : item.link ? (
                          <Link href={item.link} className="!p-0 !m-0 !w-full">
                            <Button
                              variant="ghost"
                              className="w-full justify-start !text-[15px] !font-light gap-3 px-3"
                            >
                              <item.icon className="!w-5 !h-5" />
                              <span>{item.title}</span>
                            </Button>
                          </Link>
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
                {/* Features - Hidden when collapsed */}
                {/* <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                  {features.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 px-3 !text-[15px] !font-light"
                        >
                          <item.icon className="!w-5 !h-5" />
                          <span>{item.title}</span>
                        </Button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu> */}
                <SidebarThreads />
              </SidebarGroupContent>
            </ScrollArea>
          </SidebarGroup>
        </SidebarContent>

        {/* Fixed Footer - Hidden when collapsed */}
        <div className="mt-auto px-2 group-data-[collapsible=icon]:hidden">
          <Button
            variant="outline"
            className="w-full !bg-transparent border-none justify-between h-14 px-4"
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">Upgrade to Plus</span>
              <span className="text-xs opacity-70">
                More access to the best models
              </span>
            </div>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Sidebar>
  );
}
