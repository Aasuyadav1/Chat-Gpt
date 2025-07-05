"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Slash, Plus, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DialogOverlay,
  DialogPortal,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { RxSlash } from "react-icons/rx";
import { Button } from "../ui/button";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { searchThread } from "@/action/thread.action";
import { useDebounce } from "@/hooks/use-debounce";
// import DevInput from "../global-cmp/dev-input";
// import threadsStore from "@/stores/threads.store";
import { IoMdClose } from "react-icons/io";

interface Thread {
  threadId: string;
  title: string;
  isPinned: boolean;
}

export default function SearchThreads({
  isSidebar = false,
}: {
  isSidebar?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  // const { setSearchedThreads, searchedThreads } = threadsStore();

  // Query for searching threads
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["searchThreads", debouncedSearchQuery],
    queryFn: async () => {
      const result = await searchThread({ query: debouncedSearchQuery });
      if (result.error) {
        throw new Error(result.error as string);
      }
      if (isSidebar) {
        // setSearchedThreads(result.data);
      }
      return result.data as Thread[];
    },
    enabled: isSidebar ? !!debouncedSearchQuery.trim() : isOpen, // Enable based on context
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleThreadSelect = (threadId: string) => {
    router.push(`/chat/${threadId}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleNewChat = () => {
    router.push("/chat");
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !searchQuery.trim()) {
      handleNewChat();
    }
  };

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Clear searched threads when search query is empty (for sidebar)
  // useEffect(() => {
  //   if (isSidebar && !searchQuery.trim()) {
  //     setSearchedThreads([]);
  //   }
  // }, [searchQuery, isSidebar, setSearchedThreads]);

  const filteredResults = searchResults || [];
  const hasResults = filteredResults.length > 0;
  const showRecent = !searchQuery.trim() && !isLoading;
  const showSearchResults = searchQuery.trim() && !isLoading;
  const showNoResults = searchQuery.trim() && !isLoading && !hasResults;

  if (isSidebar) {
    return (
      <Input
        className="!w-full gap-3"
        // icon2={
        //   searchQuery.length > 0 ? (
        //     <IoMdClose onClick={() => setSearchQuery("")} />
        //   ) : (
        //     <></>
        //   )
        // }
        placeholder="Search your threads..."
        role="searchbox"
        aria-label="Search your threads..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        // icon={
        //   isLoading ? (
        //     <Loader2 className="w-3.5 h-3.5 text-muted-foreground ml-1 animate-spin" />
        //   ) : (
        //     <FiSearch className="w-3.5 h-3.5 text-muted-foreground ml-1" />
        //   )
        // }
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FiSearch />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "pointer-events-auto w-full max-w-md rounded-xl bg-popover p-2.5  pt-2 text-secondary-foreground shadow-2xl outline gap-1 outline-border/20 backdrop-blur-md sm:max-w-xl"
        )}
      >
        <DialogHeader className="relative border-b border-chat-border">
          <div className="w-full rounded-t-lg bg-popover">
            <div className="mr-px flex items-center text-[15px] text-muted-foreground justify-between gap-2 pb-2 w-full">
              <div className="w-fit flex items-center">
                <FiSearch />
                <RxSlash className="opacity-20 text-lg" />
                <FiPlus />
              </div>
              <input
                className="outline-none !border-none !bg-transparent flex-1 px-1 pr-12"
                role="searchbox"
                aria-label="Search threads and messages"
                placeholder="Search or press Enter to start new chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {isLoading && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2.5 max-h-[50vh] space-y-2 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-destructive">
                Error searching threads. Please try again.
              </div>
            </div>
          )}

          {/* Search Results */}
          {showSearchResults && hasResults && (
            <div className="flex flex-col gap-1">
              <div className="flex w-full items-center justify-start gap-1.5 pl-[3px] text-color-heading text-sm">
                <FiSearch className="size-3" />
                Search Results ({filteredResults.length})
              </div>
              <ul className="flex flex-col gap-0 text-sm text-muted-foreground">
                {filteredResults.map((thread) => (
                  <li key={thread.threadId}>
                    <button
                      onClick={() => handleThreadSelect(thread.threadId)}
                      className="w-full text-left block rounded-md px-2.5 py-2 hover:bg-accent/30 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    >
                      <div className="flex items-center gap-2">
                        {thread.isPinned && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                        <span className="truncate">{thread.title}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No Results */}
          {showNoResults && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-sm text-muted-foreground mb-2">
                No threads found for "{searchQuery}"
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleNewChat}
                className="flex items-center gap-2"
              >
                <FiPlus className="size-3" />
                Start new chat
              </Button>
            </div>
          )}

          {/* Recent Chats (when no search query) */}
          {showRecent && (
            <div className="flex flex-col gap-1">
              <div className="flex w-full items-center justify-start gap-1.5 pl-[3px] text-color-heading text-sm">
                <Clock className="size-3" />
                Recent Chats
              </div>
              <ul className="flex flex-col gap-0 text-sm text-muted-foreground">
                {filteredResults.slice(0, 10).map((thread) => (
                  <li key={thread.threadId}>
                    <button
                      onClick={() => handleThreadSelect(thread.threadId)}
                      className="w-full text-left block rounded-md px-2.5 py-2 hover:bg-accent/30 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    >
                      <div className="flex items-center gap-2">
                        {thread.isPinned && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                        <span className="truncate">{thread.title}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
