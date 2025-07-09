import { useState, useCallback } from "react";
import chatStore from "@/stores/chat.store";
import { createMessage } from "@/action/message.action";
import { useQueryClient } from "@tanstack/react-query";
// import userStore from "@/stores/user.store";

interface Message {
  _id?: string;
  threadId: string;
  userId?: string;
  userQuery: string;
  attachment?: string;
  isSearch?: boolean;
  aiResponse: Array<{ content: string; model: string }>;
  createdAt?: Date;
  updatedAt?: Date;
  // Optimistic state indicators
  isPending?: boolean;
  tempId?: string;
}

interface UseStreamResponseReturn {
  isLoading: boolean;
  error: string | null;
  sendMessage: ({
    chatid,
    attachmentUrl,
    resetAttachment,
    isNewThread,
  }: {
    chatid: string;
    attachmentUrl?: string;
    resetAttachment?: () => void;
    isNewThread?: boolean;
  }) => Promise<void>;
  clearMessages: () => void;
}

export function useStreamResponse(): UseStreamResponseReturn {
  const { isLoading, setIsLoading } = chatStore();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const sendMessage = useCallback(
    async ({
      chatid,
      attachmentUrl,
      resetAttachment,
      isNewThread,
    }: {
      chatid: string;
      attachmentUrl?: string;
      resetAttachment?: () => void;
      isNewThread?: boolean;
    }) => {
      // const {currentModel,userData, currentService} = userStore.getState()      
      const { query, messages, setMessages, setQuery, isWebSearch } = chatStore.getState();
      if (!query?.trim() || isLoading) return;
      const trimmedQuery = query.trim();
      setQuery("");
      const attachment = attachmentUrl ? attachmentUrl : "";

      if (resetAttachment) {
        resetAttachment();
      }

      setIsLoading(true);
      setError(null);

      // Create optimistic message with temporary ID
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const optimisticMessage: Message = {
        tempId,
        threadId: chatid,
        userId: "sdfljaksfadfasf", // Random user id 
        userQuery: trimmedQuery,
        attachment: attachment || undefined,
        isSearch: isWebSearch,
        aiResponse: [{ content: "", model: "Gemini 2.5 Flash" }],
        isPending: true,
        createdAt: new Date(),
      };

      // Add optimistic message immediately
      const currentMessages =
        messages && Array.isArray(messages) ? messages : [];
      setMessages([...currentMessages, optimisticMessage]);

      try {
        const apiMessages =
          currentMessages && currentMessages.length > 0
            ? currentMessages.flatMap((msg: Message) => [
                {
                  role: "user" as const,
                  content: [{ type: "text", text: msg.userQuery }],
                },
                {
                  role: "assistant" as const,
                  content: [
                    { type: "text", text: msg && msg.aiResponse && msg.aiResponse.length > 0 ? msg.aiResponse[0]?.content : "" },
                  ],
                },
              ])
            : [];

        apiMessages.push({
          role: "user" as const,
          content: [
            {
              type: attachment ? "image" : "text",
              mimeType: attachment ? "image/jpeg" : "text/plain",
              text: trimmedQuery,
              image: attachment ? new URL(attachment) : undefined,
            } as any,
          ],
        });

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: apiMessages,
            // model: currentModel,
            // service: currentService,
            // geminiApiKey: userData?.geminiApiKey,
            isWebSearch: isWebSearch,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Response body is not readable");
        }

        let assistantResponse = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantResponse += chunk;

          // Update the optimistic message with streaming response
          const currentState = chatStore.getState();
          const stateMessages = currentState.messages || [];
          const updatedMessages = stateMessages.map((msg: Message) =>
            msg.tempId === tempId
              ? {
                  ...msg,
                  aiResponse: [
                    { content: assistantResponse, model: "Gemini 2.5 Flash" },
                  ],
                }
              : msg
          );
          currentState.setMessages(updatedMessages);
        }

        // Save message to database
        const savedMessage = await createMessage({
          threadId: chatid,
          isNewThread,
          userQuery: trimmedQuery, // Use trimmedQuery instead of query
          attachment: attachment,
          aiResponse: [
            { content: assistantResponse, model: "Gemini 2.5 Flash" },
          ],
        });

        if (savedMessage.error) {
          throw new Error(savedMessage.error);
        }

        // Replace optimistic message with saved message
        const finalState = chatStore.getState();
        const stateMessagesForFinal = finalState.messages || [];
        const finalMessages = stateMessagesForFinal.map((msg: Message) =>
          msg.tempId === tempId
            ? { ...savedMessage.data, isPending: false }
            : msg
        );
        finalState.setMessages(finalMessages);
      } catch (err) {
        console.error("Streaming error:", err);
        // Remove optimistic message on error
        const errorState = chatStore.getState();
        const errorStateMessages = errorState.messages || [];
        const messagesWithoutOptimistic = errorStateMessages.filter(
          (msg: Message) => msg.tempId !== tempId
        );
        errorState.setMessages(messagesWithoutOptimistic);
        setIsLoading(false);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
        queryClient.invalidateQueries({ queryKey: ["memories"] });
      }
    },
    [isLoading]
  );

  const clearMessages = useCallback(() => {
    const { setMessages, setQuery } = chatStore.getState();
    setMessages([]);
    setQuery("");
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
