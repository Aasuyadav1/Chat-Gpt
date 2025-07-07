"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { getThread, searchThread } from "@/action/thread.action";
import { Edit3, MessageSquare, Search, X } from "lucide-react";
import Link from "next/link";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: allThreads } = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const result = await getThread();
      if (result.error) {
        throw new Error("Error fetching threads");
      }
      return result.data;
    },
  });

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["searchThreads", debouncedSearch],
    queryFn: async () => {
      const result = await searchThread({ query: debouncedSearch });
      if (result.error) {
        throw new Error("Error searching threads");
      }
      return result.data;
    },
    enabled: debouncedSearch.length > 0,
  });

  const formatDate = (date: string) => {
    const today = new Date();
    const threadDate = new Date(date);
    
    if (today.toDateString() === threadDate.toDateString()) {
      return "Today";
    }
    
    const days = Math.floor((today.getTime() - threadDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 7) {
      return "Earlier";
    }
    
    return "Older";
  };

  const groupThreadsByDate = (threads: any[]) => {
    if (!threads) return {};
    return threads.reduce((groups: any, thread: any) => {
      const dateGroup = formatDate(thread.createdAt);
      if (!groups[dateGroup]) {
        groups[dateGroup] = [];
      }
      groups[dateGroup].push(thread);
      return groups;
    }, {});
  };

  const threadsToDisplay = debouncedSearch ? searchResults : [...(allThreads?.pin || []), ...(allThreads?.chat || [])];
  const groupedThreads = groupThreadsByDate(threadsToDisplay);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] !w-full p-0 gap-0">
        <div className="flex items-center p-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-8 text-sm px-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 hover:bg-accent rounded-sm"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            <Link 
              href="/chat" 
              className="flex rounded-lg items-center gap-3 p-2 hover:bg-accent text-sm"
              onClick={() => onOpenChange(false)}
            >
              <Edit3 className="h-4 w-4" />
              <span>New chat</span>
            </Link>
          </div>

          <div className="px-2">
            {Object.entries(groupedThreads).map(([dateGroup, threads]: [string, any]) => (
              <div key={dateGroup} className="mb-2">
                <div className="text-xs text-muted-foreground px-2 py-1 space-y-2">{dateGroup}</div>
                {threads.map((thread: any) => (
                  <Link
                    key={thread._id}
                    href={`/chat/${thread._id}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-sm"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{thread.title}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>


          {debouncedSearch && !isLoading && (!searchResults || searchResults.length === 0) && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No chats found
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 