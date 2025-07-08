"use client"

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getUserMemories } from '@/action/memory.action'

interface Memory {
  id: string
  content: string
}

interface MemoriesDialogProps {
  children?: React.ReactNode
}

const MemoriesDialog = ({
  children,
}: MemoriesDialogProps) => {
  const [open, setOpen] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])

  useEffect(() => {
    const fetchMemories = async () => {
      const response = await getUserMemories()
      if (response.data && Array.isArray(response.data)) {
        setMemories(response.data)
      } else {
        setMemories([])
      }
    }
    fetchMemories()
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="!max-w-4xl w-full h-[550px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">Saved memories</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              ChatGPT tries to remember your recent chats, but it may forget things over time. Saved memories are never forgotten.{" "}
              <button className="text-primary hover:underline">
                Learn more
              </button>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {memories.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">No memories found.</div>
                ) : (
                  memories.map((memory) => (
                    <div
                      key={memory.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 !font-light text-sm text-card-foreground leading-relaxed">
                        {memory.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MemoriesDialog