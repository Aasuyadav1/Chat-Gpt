"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCcw, SquarePen, Copy, Check, X, File } from "lucide-react";
import { marked } from "marked";
import { useChatStream } from "@/hooks/use-chat-stream";
import { regenerateAnotherResponse } from "@/action/message.action";
import { useQueryClient } from "@tanstack/react-query";
import chatStore from "@/stores/chat.store";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { processSpecificT3Tags } from "@/lib/chat-parser";
import { toast } from "sonner";
import { useStreamResponse } from "@/hooks/use-response-stream";


// Helper function to detect if URL is a PDF
const isPdfUrl = (url: string): boolean => {
  const urlLower = url.toLowerCase();
  return urlLower.includes('pdf') || urlLower.includes('.pdf') || urlLower.includes('application/pdf');
};

interface Message {
  _id: string;
  userQuery: string;
  aiResponse?: Array<{ content: string; model: string; _id: string }>;
  attachment?: string;
}

interface MessageActionsProps {
  onRetry?: () => void;
  onEdit?: () => void;
  totalResponses?: number;
  responseIndex?: number;
  setResponseIndex?: (index: number) => void;
  onCopy?: () => void;
  userQuery?: string;
  onBranch?: () => void;
  showBranch?: boolean;
  showEdit?: boolean;
  modelName?: string;
  role: string;
  messageId?: string;
  message?: Message;
}

// Reusable Message Actions Component
export const MessageActions: React.FC<MessageActionsProps> = ({
  onEdit,
  message,
  onCopy,
  onBranch,
  role,
  messageId,
  userQuery,
  totalResponses = 0,
  responseIndex = 0,
  setResponseIndex = () => {},
  showBranch = false,
  showEdit = true,
  modelName,
}) => {
  const { isLoading, error, response, sendMessage, clearResponse } =
    useChatStream();
  const router = useRouter();

  const queryClient = useQueryClient();
  const { messages, setIsRegenerate } = chatStore();
  const retryMessage = async () => {
    setIsRegenerate(true);
    const attachment = message?.attachment;
    const trimmedQuery = message?.userQuery;

    if (!trimmedQuery?.trim()) {
      return;
    }

    const promptMessage: any = {
      role: "user",
      content: [
        {
          type: attachment ? "image" : "text",
          mimeType: attachment ? "image/jpeg" : "text/plain",
          text: trimmedQuery,
          image: attachment ? new URL(attachment) : undefined,
        },
      ],
    };

    try {
      const response = await sendMessage({
        messages: promptMessage,
        model: "gemini-2.5-flash",
      });

      const generateResponse = await regenerateAnotherResponse({
        messageId: message?._id || "",
        aiResponse: { content: response, model: "gemini-2.5-flash" },
      });
      if (generateResponse.error) {
        toast.error("Failed to regenerate response");
      }
      if (response?.trim() !== "") {
        chatStore?.setState({
          messages: messages?.map((message: Message) => {
            if (message._id === messageId) {
              return {
                ...message,
                aiResponse: [
                  ...(message?.aiResponse || []),
                  {
                    content: response,
                    model: "gemini-2.5-flash",
                    _id: generateResponse?.data?.aiResponse?.[
                      generateResponse?.data?.aiResponse?.length - 1
                    ]?._id,
                  },
                ],
              };
            }
            return message;
          }),
        });
      }
      setResponseIndex(generateResponse?.data?.aiResponse?.length - 1 || 0);
    } catch (err) {
      console.error("Retry failed:", err);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {role === "assistant" && totalResponses > 1 && (
        <span className="flex items-center gap-1">
          <button
            disabled={responseIndex === 0}
            className="cursor-pointer"
            onClick={() => setResponseIndex(responseIndex - 1)}
          >
            <IoIosArrowBack />
          </button>{" "}
          {responseIndex + 1}/{totalResponses}{" "}
          <button
            disabled={responseIndex === totalResponses - 1}
            className="cursor-pointer"
            onClick={() => setResponseIndex(responseIndex + 1)}
          >
            <IoIosArrowForward />
          </button>
        </span>
      )}

      {/* <DevClipboard
        className="h-8 w-8 text-xs"
        textClip={
          (role === "user"
            ? userQuery
            : message?.aiResponse?.[responseIndex]?.content) || ""
        }
        beforeCopy={<Copy aria-hidden="true" />}
        afterCopy={<Check aria-hidden="true" />}
      /> */}


      {role === "assistant" && (
        // <DevTooltip tipData="Retry message">
          <Button
            variant="ghost"
            size="icon"
            disabled={isLoading}
            className="h-8 w-8 text-xs"
            aria-label="Retry message"
            onClick={retryMessage}
            data-action="retry"
            data-state="closed"
          >
            <div className="relative size-4">
              <RefreshCcw
                className={`${isLoading ? "animate-spin" : "h-4 w-4"}`}
                aria-hidden="true"
              />
              <span className="sr-only">Retry</span>
            </div>
          </Button>
        // </DevTooltip>
      )}

      {role === "user" && (
        // <DevTooltip tipData="Edit message">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-xs"
            aria-label="Edit message"
            data-state="closed"
            onClick={onEdit}
          >
            <SquarePen className="h-4 w-4" aria-hidden="true" />
          </Button>
        // </DevTooltip>
      )}

      {/* {role === "assistant" && (
        <div className="flex items-center text-nowrap pointer-events-none select-none gap-1 text-xs text-muted-foreground capitalize">
          <span>
            {message?.aiResponse?.[responseIndex]?.model
              .split("/")[1]
              .trim()
              .replace(/-/g, " ")}
          </span>
        </div>
      )} */}
    </div>
  );
};

// User Message Component

interface UserMessageProps {
  content: string;
  attachmentUrl?: string;
  messageId?: string;
  onRetry?: () => void;
  userQuery?: string;
  onEdit?: () => void;
  onCopy?: () => void;
  threadId?: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  content,
  messageId,
  onRetry,
  userQuery,
  attachmentUrl,
  onEdit,
  threadId,
  onCopy,
}) => {
  const { setQuery } = chatStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage } = useStreamResponse();


  const handleEdit = () => {
    setIsEditing(!isEditing);
    setEditContent(content);
  };

  const handleSendEditedMessage = async () => {

    const messageData = {
      messageId,
      content: editContent,
      attachmentUrl,
      userQuery: editContent
    };
    
    setQuery(editContent);
    setIsEditing(false);

    await sendMessage({
      chatid: threadId || "",
      attachmentUrl: attachmentUrl,
      resetAttachment: () => {},
      isNewThread: !threadId,
      previousMessageId: messageId,
    });

    setTimeout(() => {
      const messagesEndRef = document.querySelector("[data-messages-end]");
      messagesEndRef?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 200);
    
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(content);
    }
  };

  return (
    <div
      data-query-id={messageId}
      className="flex relative justify-end items-end flex-col duration-300 animate-in fade-in-50 zoom-in-95"
    >
      {isEditing ? (
        <div className="flex items-end gap-3 flex-col w-full">
          <div className="w-full bg-accent px-4 py-4 rounded-3xl shadow-sm">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full resize-none border-0 bg-transparent text-foreground max-h-48 min-h-16 outline-none focus:ring-0 placeholder:text-muted-foreground"
              placeholder="Type your message..."
            />
            {attachmentUrl && (
              <div className="h-26 origin-center ease-snappy scale-100 overflow-hidden mt-3 w-26 rounded-xl bg-secondary/20 border-2 p-2 border-border aspect-square">
                <input
                  type="checkbox"
                  name={messageId}
                  className={`${messageId} checked:hidden peer z-10 absolute opacity-0 inset-0`}
                />

                {isPdfUrl(attachmentUrl) ? (
                  <div className="flex flex-col items-center justify-center h-full w-full bg-red-50 rounded-lg border border-red-200 peer-checked:bg-white peer-checked:border-red-300">
                    <File className="h-6 w-6 text-red-600 mb-1" />
                    <span className="text-[10px] font-medium text-red-600 leading-none">PDF</span>
                    <span className="text-[8px] text-red-500 mt-0.5 leading-none">Document</span>
                  </div>
                ) : (
                  <img
                    className="object-cover relative rounded-lg h-full w-full peer-checked:object-contain peer-checked:max-w-full peer-checked:max-h-full"
                    src={attachmentUrl}
                    alt={messageId + "-attachment"}
                    loading="lazy"
                  />
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditContent(content);
              }}
              className="h-8 px-3 text-sm"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendEditedMessage}
              className="h-8 px-3 text-sm"
            >
              Send
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            role="article"
            aria-label="Your message"
            className="group inline-block max-w-[80%] break-words rounded-xl border border-secondary/50 bg-secondary/50 p-3.5 px-4 text-left"
          >
            <span className="sr-only">Your message: </span>
            <div className="flex flex-col gap-3">
              <div className="prose prose-pink max-w-none dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0">
                <p>{content || ""}</p>
              </div>
            </div>
            <div className="absolute right-0 -bottom-10 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100">
              <MessageActions
                role="user"
                onEdit={handleEdit}
                onCopy={onCopy}
                showBranch={false}
                showEdit={true}
              />
            </div>
          </div>
          {attachmentUrl && (
            <div className="h-26 origin-center ease-snappy scale-100 overflow-hidden mt-2  w-26 rounded-xl bg-secondary/20 border-2 p-2 border-secondary/50 aspect-square">
              <input
                type="checkbox"
                name={messageId}
                // id={messageId}
                className={`${messageId} checked:hidden peer z-10 absolute opacity-0 inset-0`}
              />

              {isPdfUrl(attachmentUrl) ? (
                <div className="flex flex-col items-center justify-center h-full w-full bg-red-50 rounded-lg border border-red-200 peer-checked:bg-white peer-checked:border-red-300">
                  <File className="h-6 w-6 text-red-600 mb-1" />
                  <span className="text-[10px] font-medium text-red-600 leading-none">PDF</span>
                  <span className="text-[8px] text-red-500 mt-0.5 leading-none">Document</span>
                </div>
              ) : (
                <img
                  className="object-cover relative rounded-lg h-full w-full peer-checked:object-contain peer-checked:max-w-full peer-checked:max-h-full"
                  src={attachmentUrl}
                  alt={messageId + "-attachment"}
                  loading="lazy"
                />
              )}

            </div>
          )}
        </>
      )}
    </div>
  );
};

interface AIResponseProps {
  content: string;
  responseIndex?: number;
  setResponseIndex?: (index: number) => void;
  totalResponses?: number;
  message?: Message;
  messageId?: string;
  threadId?: string;
  isStreaming?: boolean;
  subMessageId?: string;
  isLoading?: boolean;
  modelName?: string;
  onRetry?: () => void;
  onCopy?: () => void;
  onBranch?: () => void;
}

export const AIResponse: React.FC<AIResponseProps> = ({
  content,
  responseIndex = 0,
  setResponseIndex,
  totalResponses,
  subMessageId,
  message,
  messageId,
  threadId,
  isStreaming = false,
  modelName = "Gemini 2.5 Flash",
  onRetry,
  onCopy,
  onBranch,
}) => {
  const [htmlContent, setHtmlContent] = useState("");

  const convertMarkdown = async () => {
    try {
      const html = await marked(content || "");
      const { processedHtml } = await processSpecificT3Tags(html || "");
      setHtmlContent(processedHtml);
    } catch (error) {
      console.error("Error converting Markdown:", error);
      setHtmlContent(content || "");
    }
  };

  useEffect(() => {
    convertMarkdown();
  }, [content]);

  return (
    <div
      data-message-id={messageId}
      data-sub-message-id={subMessageId}
      className="flex justify-start"
    >
      <div className="group relative w-full max-w-full break-words">
        <div
          role="article"
          aria-label="Assistant message"
          className="prose prose-pink max-w-none dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0"
        >
          <span className="sr-only">Assistant Reply: </span>
          {!htmlContent ? (
            <div className="flex space-x-2 mt-2">
              <div className="w-2.5 h-2.5 bg-primary/50 rounded-full animate-bounce-dot animate-delay-1"></div>
              <div className="w-2.5 h-2.5 bg-primary/50 rounded-full animate-bounce-dot animate-delay-2"></div>
              <div className="w-2.5 h-2.5 bg-primary/50 rounded-full animate-bounce-dot"></div>
            </div>
          ) : (
            <div
              className="mark-response"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>
        <div className="absolute left-0 -ml-0.5 mt-2 flex w-full flex-row justify-start gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100">
          <div className="flex w-full flex-row justify-between gap-1 sm:w-auto">
            <MessageActions
              onRetry={onRetry}
              role="assistant"
              message={message}
              messageId={messageId}
              totalResponses={totalResponses}
              responseIndex={responseIndex}
              setResponseIndex={setResponseIndex}
              onCopy={onCopy}
              onBranch={onBranch}
              showBranch={true}
              showEdit={false}
              modelName={modelName}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Pair Component (User + AI Response)
interface MessagePairProps {
  message: Message;
  threadId: string;
}

const MessagePair: React.FC<MessagePairProps> = ({ message, threadId }) => {
  const [responseIndex, setResponseIndex] = useState(0);
  const aiContent = message?.aiResponse?.[responseIndex]?.content || "";
  const subMessageId = message?.aiResponse?.[responseIndex]?._id || "";
  return (
    <div className="space-y-16">
      <UserMessage
        content={message.userQuery}
        attachmentUrl={message.attachment}
        messageId={message._id}
        threadId={threadId}
      />
      <AIResponse
        content={aiContent}
        subMessageId={subMessageId}
        message={message}
        totalResponses={message.aiResponse?.length || 0}
        responseIndex={responseIndex}
        setResponseIndex={setResponseIndex}
        messageId={message._id}
        threadId={threadId}
      />
    </div>
  );
};

export default MessagePair;
