"use server";
import { auth } from "@/auth";
import { google } from "@ai-sdk/google";
// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

export const generateAiResponse = async ({
  message,
}: {
  message: string;
}) => {
  try {
    if (!message) {
      throw new Error("Message is required");
    }
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
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
