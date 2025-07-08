"use client";
import React, { KeyboardEvent, useState, useRef } from "react";
import { ArrowUp, Globe, Paperclip, X, File, Plus, Settings, Image } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import chatStore from "@/stores/chat.store";
import mongoose from "mongoose";
import { useCloudinaryUpload } from "@/hooks/use-upload";
import { useQueryClient } from "@tanstack/react-query";
import { useStreamResponse } from "@/hooks/use-response-stream";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { X as XIcon } from "lucide-react";

interface ChatInputProps {
  placeholder?: string;
  modelName?: string;
  isSearchEnabled?: boolean;
  isFileAttachEnabled?: boolean;
  isNewThread?: boolean;
}

function ChatInput({
  placeholder = "Type your message here...",
  modelName = "Gemini 2.5 Flash",
  isSearchEnabled = false,
  isFileAttachEnabled = true,
  isNewThread = false,
}: ChatInputProps) {
  const params = useParams();
  const router = useRouter();
  const { sendMessage } = useStreamResponse();

  const {
    setQuery,
    setMessages,
    isLoading,
    query,
    setIsRegenerate,
    setIsWebSearch,
    isWebSearch,
  } = chatStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

   // Cloudinary upload hook
   const { uploadState, uploadFile, resetUpload } = useCloudinaryUpload();
   const [attachmentUrl, setAttachmentUrl] = useState<string>("");
   const [attachmentPreview, setAttachmentPreview] = useState<{
     name: string;
     type: string;
     url: string;
   } | null>(null);

  const queryClient = useQueryClient();

  const [selectedTool, setSelectedTool] = useState<null | "image" | "web">(null);

  const generateObjectId = async () => {
    return new mongoose.Types.ObjectId().toString();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!query.trim() || isLoading || uploadState.isUploading) return;
      setQuery(query.trim());
      handleSubmit();
    }
  };

   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Show preview immediately
      setAttachmentPreview({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file), // Temporary URL for preview
      });

      // Upload to Cloudinary
      const uploadResult = await uploadFile(file);

      // Set the Cloudinary URL
      setAttachmentUrl(uploadResult.secure_url);

      // Update preview with Cloudinary URL
      setAttachmentPreview((prev) =>
        prev
          ? {
              ...prev,
              url: uploadResult.secure_url,
            }
          : null
      );
    } catch (error) {
      console.error("Upload failed:", error);
      // Remove preview on error
      setAttachmentPreview(null);
      setAttachmentUrl("");
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentPreview(null);
    setAttachmentUrl("");
    resetUpload();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    
    const generatedId = await generateObjectId();
    setIsRegenerate(false);
    if (!params.chatid) {
      setMessages([]);
      router.push(`/chat/${generatedId}`);
    }
    await sendMessage({
      chatid: (params.chatid as string) || generatedId,
      attachmentUrl: attachmentUrl,
      resetAttachment: handleRemoveAttachment,
      isNewThread: !params.chatid,
    });

    if (!params.chatid) {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    }
    handleRemoveAttachment();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading || uploadState.isUploading) return;
    handleSubmit();
  };

  return (
    <div className="!w-full !max-w-[710px] bg-accent px-4 py-4 rounded-3xl">
      <div>
        <form className="" onSubmit={handleFormSubmit}>
          {attachmentPreview && (
            <div className="mb-2 p-1.5 bg-muted/30 group h-12 aspect-square w-fit grid items-center relative rounded-lg border border-border/50">
              <div className="grid place-items-center gap-2 w-fit rounded-md">
                {attachmentPreview.type.startsWith("pdf/") && (
                  <File className="h-4 w-4" />
                )}
                {attachmentPreview.type.startsWith("image/") && (
                  <img
                    src={attachmentPreview.url}
                    alt="Preview"
                    className="h-8 w-8 object-cover rounded"
                  />
                )}
              </div>

              <X
                className="h-5 rounded-md absolute group-hover:flex border-2 border-secondary hidden -top-2 -right-2 p-0 bg-destructive/20"
                onClick={handleRemoveAttachment}
                size={18}
              />
            </div>
          )}

          <div className="flex flex-grow flex-col">
            <div className="flex flex-grow flex-row items-start">
              <textarea
                placeholder={placeholder}
                autoFocus
                id="chat-input"
                className="w-full max-h-18 min-h-[54px] resize-none bg-transparent text-base leading-6 text-foreground outline-none placeholder:text-secondary-foreground/60 disabled:opacity-50 transition-opacity"
                aria-label="Message input"
                aria-describedby="chat-input-description"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                onKeyDown={handleKeyDown}
              />
              <div id="chat-input-description" className="sr-only">
                Press Enter to send, Shift + Enter for new line
              </div>
            </div>

            <div className="-mb-px mt-2 flex w-full flex-row-reverse justify-between">
              <div
                className="-mr-0.5 -mt-0.5 flex items-center justify-center gap-2"
                aria-label="Message actions"
              >
                <Button
                  variant="default"
                  type="submit"
                  size="icon"
                  disabled={
                    isLoading ||
                    (!query.trim() && !attachmentUrl) ||
                    uploadState.isUploading
                  }
                  className="transition-[opacity, translate-x] h-9 w-9 duration-200"
                >
                  <ArrowUp className="!size-5" />
                </Button>
              </div>

              <div className="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center">
                <div className="ml-[-10px] flex items-center gap-3">
                  {/* Plus Dropdown Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="!rounded-full  !h-auto !p-2"
                        aria-label="Add"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Paperclip className="size-4" />
                        <span>Add photos and files</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Tools Dropdown Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="!rounded-full  !h-auto !p-2"
                        aria-label="Tools"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="max-sm:hidden">Tools</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => setSelectedTool("image")}
                      >
                        <Image className="size-4" />
                        <span>Create an image</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => {
                          setSelectedTool("web");
                          setIsWebSearch(!isWebSearch);
                        }}
                      >
                        <Globe className="size-4" />
                        <span>Search the web</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Selected Tool Pill */}
                  {selectedTool && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md border text-primary cursor-default text-sm !p-2">
                      {selectedTool === "image" && <Image className="h-4 w-4 text-primary" />}
                      {selectedTool === "web" && <Globe className="h-4 w-4 text-primary" />}
                      <span>
                        {selectedTool === "image" ? "Image" : "Web"}
                      </span>
                      <XIcon
                        className="h-4 w-4 ml-1 cursor-pointer text-blue-400"
                        onClick={() => setSelectedTool(null)}
                      />
                    </span>
                  )}

                  {/* File Attach Button (hidden, triggered by dropdown) */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    disabled={attachmentUrl ? true : false}
                    multiple={false}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatInput;
