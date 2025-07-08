"use client";
import React from "react";
import ChatInput from "@/components/chat/chat-input";
import { getMessages } from "@/action/message.action";
import DisplayMessage from "@/components/global/display-message";
import MessagePair from "@/components/chat/message-container";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import chatStore from "@/stores/chat.store";
import TextSelectionDropdown from "@/components/chat/selection-dropdown";

const page = () => {
  const params = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, setMessages, isLoading, isRegenerate } = chatStore();
  
  const { data, isLoading: isQueryLoading } = useQuery({
    queryKey: ["thread-messages", params.chatid],
    queryFn: async () => {
      const posts = await getMessages({ _id: params.chatid as string });
      // Only update messages from database if we're not currently streaming
      if (posts.data && !isLoading) {
        setMessages(posts.data);
      }
      return posts.data;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!params.chatid,
  });

  // Auto-scroll to bottom when messages or response updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  // Scroll when response updates (streaming)
  useEffect(() => {
    if (!isRegenerate) {
      scrollToBottom();
    }
  }, [isLoading, messages]);

  // Show loading state when fetching thread data and no messages exist
  const shouldShowLoader = isQueryLoading && (!messages || messages.length === 0) && !isLoading;

  return (
    <div className="overflow-hidden">
      <div className="mt-10 py-10 overflow-y-auto h-[calc(100vh-235px)]">
        <TextSelectionDropdown />

        <div
          role="log"
          id="text-selection-container"
          aria-label="Chat messages"
          aria-live="polite"
          className="mx-auto flex w-full max-w-[710px] flex-col pb-20 space-y-12 px-2"
        >
          {/* Show loader when switching between chats */}
          {shouldShowLoader ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            /* Render stored messages */
            messages &&
            Array.isArray(messages) &&
            messages.length > 0 &&
            messages.map((message: any, index: number) => (
              <MessagePair key={index} message={message} />
            ))
          )}
        </div>
      </div>
      <div ref={messagesEndRef} />
      <div className="z-10 bg-background rounded-tl-3xl max-w-[710px] mx-auto rounded-tr-3xl w-full">
        <ChatInput />
        <p className="text-center my-4 text-sm opacity-80">
          ChatGPT can make mistakes. Check important info. See Cookie
          Preferences.
        </p>
      </div>
    </div>
  );
};

export default page;
