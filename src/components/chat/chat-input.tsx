"use client";

import React, { KeyboardEvent, useState, useRef } from "react";
import { ArrowUp, Globe, Paperclip, X, File } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface ChatInputProps {
  placeholder?: string;
  modelName?: string;
  isSearchEnabled?: boolean;
  isFileAttachEnabled?: boolean;
}

function ChatInput({
  placeholder = "Type your message here...",
  modelName = "Gemini 2.5 Flash",
  isSearchEnabled = false,
  isFileAttachEnabled = true,
}: ChatInputProps) {
  const params = useParams();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [attachmentPreview, setAttachmentPreview] = useState<{
    name: string;
    type: string;
    url: string;
  } | null>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
  };

  // Handle file selection and upload
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

      // Set the Cloudinary URL

      // Update preview with Cloudinary URL
      setAttachmentPreview((prev) =>
        prev
          ? {
              ...prev,
              url: URL.createObjectURL(file),
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

  // Remove attachment
  const handleRemoveAttachment = () => {
    setAttachmentPreview(null);
    setAttachmentUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    handleRemoveAttachment();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div className="!w-full !max-w-[710px] bg-accent px-4 py-4 rounded-3xl">
      <div>
        <form onSubmit={handleFormSubmit}>
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
                className="w-full max-h-64 min-h-[54px] resize-none bg-transparent text-base leading-6 text-foreground outline-none placeholder:text-secondary-foreground/60 disabled:opacity-50 transition-opacity"
                aria-label="Message input"
                aria-describedby="chat-input-description"
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
                  disabled={false}
                  className="transition-[opacity, translate-x] h-9 w-9 duration-200"
                >
                  <ArrowUp className="!size-5" />
                </Button>
              </div>

              <div className="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center">
                <div className="ml-[-7px] flex items-center gap-1">
                  {/* Search Button */}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`
                      
                      !rounded-full text-xs !h-auto py-1.5 !px-2
                      `}
                    aria-label="Web search"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="max-sm:hidden">Search</span>
                  </Button>

                  {/* File Attach Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!rounded-full text-xs !h-auto py-1.5 !px-2.5"
                    aria-label={
                      isFileAttachEnabled
                        ? "Attach file"
                        : "Attaching files is a subscriber-only feature"
                    }
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" />
                  </Button>

                  {/* Hidden File Input */}
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
