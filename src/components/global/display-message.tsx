"use client";
import React, { useEffect } from "react";
import chatStore from "@/stores/chat.store";

const DisplayMessage = ({ initialMessages }: { initialMessages: any }) => {
  const { messages, setMessages } = chatStore();

  useEffect(() => {
    if (initialMessages.length > 0) {
        setMessages(initialMessages)
    }
  }, [initialMessages]);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {messages.length > 0 &&
        messages?.map((message: any, index: number) => (
          <div key={message._id}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full"></div>
              <div className="">{message?.role}</div>
            </div>
            <div className="">{message?.content}</div>
          </div>
        ))}
    </div>
  );
};

export default DisplayMessage;
