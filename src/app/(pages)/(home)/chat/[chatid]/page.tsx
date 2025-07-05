import React from "react";
import ChatInput from "@/components/chat/chat-input";
import { getMessages } from "@/action/message.action";
import DisplayMessage from "@/components/global/display-message";
import MessagePair from "@/components/chat/message-container";

const page = async ({ params }: { params: Promise<{ chatid: string }> }) => {
  const { chatid } = await params;
  const messages = await getMessages({ _id: chatid });
  console.log("from the database messages", messages);

  return (
    <div className="flex h-full flex-col gap-4 justify-center items-center">
      <div className="w-full h-full max-w-[710px] relative">
        <div className="py-10">
          <p className="text-center text-sm my-4 opacity-80">All messages</p>
          <DisplayMessage initialMessages={messages} />
          <div
            role="log"
            id="text-selection-container"
            aria-label="Chat messages"
            aria-live="polite"
            className="mx-auto flex w-full max-w-3xl flex-col space-y-12 px-4 pb-[calc(100vh-25rem)] pt-10"
          >
            {/* Render stored messages */}
            {messages &&
              Array.isArray(messages.data) &&
              messages.data.length > 0 &&
              messages.data.map((message: any, index: number) => (
                <MessagePair key={index} message={message} />
              ))}
          </div>
        </div>
        <div className="absolute z-10 bg-background rounded-tl-3xl rounded-tr-3xl -bottom-2 left-0 w-full">
          <ChatInput />
          <p className="text-center text-sm my-4 opacity-80">
            ChatGPT can make mistakes. Check important info. See Cookie
            Preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default page;
