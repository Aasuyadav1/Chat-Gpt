import { useState, useCallback } from "react";
import chatStore from "@/stores/chat.store";
import { createMessage, deleteMessage } from "@/action/message.action";
import { useQueryClient } from "@tanstack/react-query";
// import userStore from "@/stores/user.store";

// Helper function to detect file type from URL
const getFileTypeFromUrl = (url: string) => {
  const urlLower = url.toLowerCase();

  // Check for image types
  if (
    urlLower.includes("image/") ||
    urlLower.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?|$)/)
  ) {
    return {
      type: "image",
      mimeType: urlLower.includes("png")
        ? "image/png"
        : urlLower.includes("gif")
        ? "image/gif"
        : urlLower.includes("webp")
        ? "image/webp"
        : "image/jpeg",
    };
  }

  // Check for PDF
  if (urlLower.includes("pdf") || urlLower.includes(".pdf")) {
    return {
      type: "document",
      mimeType: "application/pdf",
    };
  }

  // Check for text/document types
  if (
    urlLower.includes(".txt") ||
    urlLower.includes(".doc") ||
    urlLower.includes(".docx")
  ) {
    return {
      type: "document",
      mimeType: urlLower.includes(".txt")
        ? "text/plain"
        : urlLower.includes(".docx")
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword",
    };
  }

  // Default to text if unknown
  return {
    type: "text",
    mimeType: "text/plain",
  };
};

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
    previousMessageId,
  }: {
    chatid: string;
    attachmentUrl?: string;
    resetAttachment?: () => void;
    isNewThread?: boolean;
    previousMessageId?: string | null;
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
      previousMessageId = null,
    }: {
      chatid: string;
      attachmentUrl?: string;
      resetAttachment?: () => void;
      isNewThread?: boolean;
      previousMessageId?: string | null;
    }) => {
      // const {currentModel,userData, currentService} = userStore.getState()

      // if previous message id is provided, remove it from the messages array

      if (previousMessageId) {
        const { messages, setMessages } = chatStore.getState();
        setMessages(
          messages.filter((msg: Message) => msg._id !== previousMessageId)
        );
      }

      const { query, messages, setMessages, setQuery, isWebSearch } =
        chatStore.getState();
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
        // Only include the last 6 conversations for context
        const recentMessages =
          currentMessages && currentMessages.length > 0
            ? currentMessages.slice(-6) // Take only the last 6 messages
            : [];

        const apiMessages = recentMessages.flatMap((msg: Message) => [
          {
            role: "user" as const,
            content: [{ type: "text", text: msg.userQuery }],
          },
          {
            role: "assistant" as const,
            content: [
              {
                type: "text",
                text:
                  msg && msg.aiResponse && msg.aiResponse.length > 0
                    ? msg.aiResponse[0]?.content
                    : "",
              },
            ],
          },
        ]);

        // Determine content structure based on attachment type
        let messageContent: any[] = [{ type: "text", text: trimmedQuery }];

        if (attachment) {
          const fileInfo = getFileTypeFromUrl(attachment);

          if (fileInfo.type === "image") {
            // For images, add as image content
            messageContent.push({
              type: "image",
              image: new URL(attachment),
              mimeType: fileInfo.mimeType,
            });
          } else if (fileInfo.type === "document") {
            const pdfResp = await fetch(attachment);
            const arrayBuffer = await pdfResp.arrayBuffer();
            const base64 = btoa(
              String.fromCharCode(...new Uint8Array(arrayBuffer))
            );

            messageContent.push({
              type: "file",
              data: base64,
              mimeType: "application/pdf",
            });
          }
        }

        apiMessages.push({
          role: "user" as const,
          content: messageContent,
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

        if (previousMessageId) {
          await deleteMessage({ messageId: previousMessageId });
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
