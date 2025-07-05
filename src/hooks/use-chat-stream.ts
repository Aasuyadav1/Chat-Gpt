import { useState, useCallback } from "react";

interface AiMessage {
  role: "user" | "assistant";
  content: Array<{
    type: "text" | "image";
    mimeType?: string;
    text: string;
    image?: URL;
  }>;
}

interface UseStreamResponseReturn {
  isLoading: boolean;
  error: string | null;
  response: string;
  sendMessage: ({
    messages,
    model,
    service,
    geminiApiKey,
  }: {
    messages: AiMessage[];
    model: string;
    service: string;
    geminiApiKey: string;
  }) => Promise<string>;
  clearResponse: () => void;
}

export function useChatStream(): UseStreamResponseReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState("");

  const sendMessage = useCallback(
    async ({
      messages,
      model,
      service,
      geminiApiKey,
    }: {
      messages: AiMessage[];
      model: string;
      service: string;
      geminiApiKey: string;
    }): Promise<string> => {
      if (isLoading) return "";

      setIsLoading(true);
      setResponse("");
      setError(null);

      try {
        const apiResponse = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages:[messages],
            model,
            service,
            geminiApiKey,
          }),
        });

        if (!apiResponse.ok) {
          throw new Error(`HTTP error! status: ${apiResponse.status}`);
        }

        const reader = apiResponse.body?.getReader();
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
          setResponse(assistantResponse);
        }

        return assistantResponse;
      } catch (err) {
        console.error("Streaming error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const clearResponse = useCallback(() => {
    setResponse("");
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    response,
    sendMessage,
    clearResponse,
  };
}
