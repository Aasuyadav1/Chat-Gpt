"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserMemories,
  deleteMemory,
  deleteAllMemories,
} from "@/action/memory.action";
import { MemoryType } from "@/types/memory.type";
import { Trash2 } from "lucide-react";
import { FiLoader } from "react-icons/fi";

interface MemoriesDialogProps {
  children?: React.ReactNode;
}

const MemoriesDialog = ({ children }: MemoriesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    data: memories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["memories"],
    queryFn: async () => {
      const result = await getUserMemories();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setDeleteDialogOpen(false);
      setMemoryToDelete(null);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllMemories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setDeleteAllDialogOpen(false);
    },
  });

  const handleDeleteMemory = (memoryId: string) => {
    setMemoryToDelete(memoryId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (memoryToDelete) {
      deleteMutation.mutate(memoryToDelete);
    }
  };

  const confirmDeleteAll = () => {
    deleteAllMutation.mutate();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="!max-w-4xl w-full h-[520px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  Saved memories
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 font-light text-muted-foreground">
                  ChatGPT tries to remember your recent chats, but it may forget
                  things over time. Saved memories are never forgotten.{" "}
                  <button className="text-primary hover:underline">
                    Learn more
                  </button>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full py-4 pr-4">
              <div>
                {isLoading ? (
                  <div className="text-muted-foreground text-center py-8 flex justify-center">
                    <FiLoader className="animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8">Error loading memories</div>
                ) : memories.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">
                    No memories found.
                  </div>
                ) : (
                  memories.map((memory: MemoryType) => (
                    <div
                      key={memory.id}
                      className="flex items-start gap-3 p-3 border"
                    >
                      <div className="flex-1 !font-light text-sm text-card-foreground leading-relaxed">
                        {memory.memory}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMemory(memory.id)}
                        disabled={deleteMutation.isPending}
                        className="text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            {memories.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteAllDialogOpen(true)}
                disabled={deleteAllMutation.isPending}
              >
                {deleteAllMutation.isPending ? (
                  <div className="flex items-center gap-2">
                  Deleting
                  <FiLoader className="animate-spin" />
                </div>
                ) : (
                  "Delete All"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Memory Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Memory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this memory? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <div className="flex items-center gap-2">
                  Deleting
                  <FiLoader className="animate-spin" />
                </div>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Memories Confirmation Dialog */}
      <AlertDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Memories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all memories? This action cannot
              be undone and will permanently remove all saved memories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAll}
              disabled={deleteAllMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAllMutation.isPending ? <div className="flex items-center gap-2">
                  Deleting
                  <FiLoader className="animate-spin" />
                </div> : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MemoriesDialog;
