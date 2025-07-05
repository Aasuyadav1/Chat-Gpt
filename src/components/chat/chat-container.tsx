"use client";
import React, { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import chatStore from "@/stores/chat.store";
import { getMessages } from "@/action/message.action";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import TextSelectionDropdown from "./selection-dropdown";

const MessagePair = dynamic(() => import('./message-container'), {
  loading: () => <div/>
})

const ChatContainer = () => {
  const params = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, setMessages, isLoading, isRegenerate } = chatStore();
  const { data } = useQuery({
    queryKey: ["thread-messages", params.chatid],
    queryFn: async () => {
      const posts = await getMessages({ _id: params.chatid as string });
      posts.data && setMessages(posts.data);
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

  return (
   <>
   <TextSelectionDropdown />
    <div
      role="log"
      id="text-selection-container"
      aria-label="Chat messages"
      aria-live="polite"
      className="mx-auto flex w-full max-w-3xl flex-col space-y-12 px-4 pb-[calc(100vh-25rem)] pt-10"
    >
      {/* Render stored messages */}
      {messages &&
        Array.isArray(messages) &&
        messages.length > 0 &&
        messages.map((message, index) => (
          <MessagePair key={index} message={message} />
        ))}
    </div>

    <div ref={messagesEndRef}/>
   </>
  );
};

export default ChatContainer;
