"use client";
import React, { useState } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { LuPin, LuPinOff } from "react-icons/lu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IoMdClose } from "react-icons/io";
import {
  getThread,
  pinThread,
  deleteThread,
  renameThread,
} from "@/action/thread.action";
import { PiChatSlashDuotone } from "react-icons/pi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, MoreHorizontal } from "lucide-react";
import { FiLoader } from "react-icons/fi";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface Thread {
  _id: string;
  parentChatId: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  userId: string;
  parentFolderId?: string;
}

interface Folder {
  _id: string;
  title: string;
  context: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface FolderWithThreads {
  folder: Folder;
  threads: Thread[];
}

interface ThreadData {
  pin: Thread[];
  chat: Thread[];
}

const SidebarThreads = () => {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const params = useParams();

  // Fetch threads using TanStack Query (now includes folders)
  const {
    data: threadsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const result = await getThread();
      console.log("all threads", result.data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data as ThreadData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Pin/Unpin thread mutation
  const pinMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const result = await pinThread({ threadId });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success(data?.isPinned ? "Thread pinned" : "Thread unpinned");
    },
    onError: (error) => {
      console.error("Error pinning thread:", error);
      toast.error("Failed to pin/unpin thread");
    },
  });

  // Delete thread mutation
  const deleteMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const result = await deleteThread({ threadId });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Thread deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedThread(null);
    },
    onError: (error) => {
      console.error("Error deleting thread:", error);
      toast.error("Failed to delete thread");
    },
  });

  // Rename thread mutation
  const renameMutation = useMutation({
    mutationFn: async ({
      threadId,
      title,
    }: {
      threadId: string;
      title: string;
    }) => {
      const result = await renameThread({ threadId, title });
      if (result?.error) {
        throw new Error(result?.error as string);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Thread renamed successfully");
      setRenameDialogOpen(false);
      setSelectedThread(null);
      setNewTitle("");
    },
    onError: (error) => {
      console.error("Error renaming thread:", error);
      toast.error("Failed to rename thread");
    },
  });

  const handlePinThread = (threadId: string) => {
    pinMutation.mutate(threadId);
  };

  const handleDeleteThread = (threadId: string) => {
    deleteMutation.mutate(threadId);
  };

  const handleRenameThread = () => {
    if (!selectedThread || !newTitle.trim()) return;
    renameMutation.mutate({
      threadId: selectedThread._id,
      title: newTitle.trim(),
    });
  };

  const openDeleteDialog = (thread: Thread) => {
    setSelectedThread(thread);
    setDeleteDialogOpen(true);
  };

  const openRenameDialog = (thread: Thread) => {
    setSelectedThread(thread);
    setNewTitle(thread.title);
    setRenameDialogOpen(true);
  };

  if (isLoading) {
    return (
      <SidebarContent>
        <SidebarGroup className="space-y-2 group-data-[collapsible=icon]:hidden">
          <SidebarMenu>
            {Array.from({ length: 3 }).map((_, index) => (
              <SidebarMenuItem
                key={index}
                className="p-2 space-y-1 !text-[15px] font-light flex items-center relative group/link-item rounded-lg"
              >
                <Skeleton className="h-6 flex-1" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="space-y-2 group-data-[collapsible=icon]:hidden">
          <SidebarMenu>
            {Array.from({ length: 6 }).map((_, index) => (
              <SidebarMenuItem
                key={index}
                className="p-2 space-y-1 !text-[15px] font-light flex items-center relative group/link-item rounded-lg"
              >
                <Skeleton className="h-6 flex-1" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    );
  }

  // Render thread item component
  const ThreadItem = ({
    thread,
    showBranchIcon = false,
    inFolder = false,
  }: {
    thread: Thread;
    showBranchIcon?: boolean;
    inFolder?: boolean;
  }) => {
    const isActionLoading = pinMutation.isPending || deleteMutation.isPending;
    const isCurrentThreadLoading =
      pinMutation.variables === thread._id ||
      deleteMutation.variables === thread._id;

    return (
      <SidebarMenuItem
        className={`hover:bg-sidebar-accent px-3 !text-[15px] font-light flex items-center relative px-0 group/link-item rounded-lg ${params.chatid === thread._id ? "!bg-sidebar-accent" : ""
          } ${inFolder ? "ml-4" : ""}`}
      >
        <Link
          className={`flex-1 p-2 text-nowrap overflow-hidden truncate ${showBranchIcon ? "flex items-center gap-2" : "block"
            }`}
          prefetch={true}
          href={`/chat/${thread._id}`}
        >
          <p className={`truncate ${showBranchIcon ? "flex-1" : ""}`}>
            {thread.title}
          </p>
        </Link>
        <div className="flex items-center gap-1 opacity-0 group-hover/link-item:opacity-100 transition-opacity duration-200 pr-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePinThread(thread._id);
            }}
            disabled={isActionLoading}
          >
            {isCurrentThreadLoading && pinMutation.isPending ? (
              <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            ) : thread.isPinned ? (
              <LuPinOff className="h-3 w-3" />
            ) : (
              <LuPin className="h-3 w-3" />
            )}
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                disabled={isActionLoading}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-32 z-50 *:cursor-pointer"
              align="end"
              side="right"
              sideOffset={5}
              alignOffset={-5}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinThread(thread._id);
                }}
                disabled={pinMutation.isPending}
                className="text-sm"
              >
                {thread.isPinned ? (
                  <LuPinOff className="mr-2 h-3 w-3" />
                ) : (
                  <LuPin className="mr-2 h-3 w-3" />
                )}
                {thread.isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openRenameDialog(thread);
                }}
                className="text-sm"
              >
                <Edit className="mr-2 h-3 w-3" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteDialog(thread);
                }}
                className="text-red-500 focus:text-red-500 text-sm"
              >
                <IoMdClose className="mr-2 h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarContent>
        {threadsData?.pin && threadsData.pin.length > 0 && (
          <SidebarGroup className="space-y-2 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className=" text-[15px] font-light">
              Pinned
            </SidebarGroupLabel>
            <SidebarMenu>
              {threadsData.pin.map((thread) => (
                <ThreadItem
                  key={thread._id}
                  thread={thread}
                  showBranchIcon={thread.parentChatId !== null}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {threadsData?.chat && threadsData.chat.length > 0 && (
          <SidebarGroup className="space-y-2 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="text-[15px] font-light">Chats</SidebarGroupLabel>
            <SidebarMenu>
              {threadsData.chat.map((thread) => (
                <ThreadItem
                  key={thread._id}
                  thread={thread}
                  showBranchIcon={thread.parentChatId !== null}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {(!threadsData ||
          ((!threadsData.chat || threadsData.chat.length === 0) &&
            threadsData.pin.length === 0)) && (
            <div className="p-4 text-center gap-3 text-muted-foreground flex-col mt-4 flex justify-center items-center">
              <PiChatSlashDuotone size={30} />  No threads found
            </div>
          )}
      </SidebarContent>

      {/* Delete Thread Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedThread?.title}" This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedThread(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedThread && handleDeleteThread(selectedThread._id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Thread Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Thread</DialogTitle>
            <DialogDescription>
              Enter a new name for your thread. This will help you identify it
              later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="items-center space-y-2">
              <Label htmlFor="thread-title" className="text-right">
                Title
              </Label>
              <Input
                id="thread-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter thread title..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRenameThread();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRenameDialogOpen(false);
                setSelectedThread(null);
                setNewTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameThread}
              disabled={!newTitle.trim() || renameMutation.isPending}
            >
              {renameMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SidebarThreads;
