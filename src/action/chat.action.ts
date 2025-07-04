"use server";
import { auth } from "@/auth";
import { google } from "@ai-sdk/google";
// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

export const generateAiResponse = async ({
  message,
  model,
  geminiApiKey,
  service,
}: {
  message: string;
  model: string;
  geminiApiKey?: string;
  service: string;
}) => {
  try {
    if (!message) {
      throw new Error("Message is required");
    }
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = geminiApiKey;
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // const openrouter = createOpenRouter({
    //   apiKey: decrypt(session?.user?.openRouterApiKey as string),
    // });

    const { text } = await generateText({
      model:
        service === "openrouter"
          ? google(`models/${model.split("/")[1].trim()}`)
          : google(`models/${model.split("/")[1].trim()}`),
      prompt: message,
    });

    if (!text || text.trim() === "") {
      throw new Error("Received empty response from AI model");
    }

    return {
      data: text,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
};
