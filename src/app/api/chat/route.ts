import { connect } from 'mongoose';
import { NextRequest, NextResponse } from "next/server";
import { generateText, streamText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { GoogleGenAI, Modality } from "@google/genai";
import axios from "axios";
import { auth } from "@/auth";
import { addMemories, createMem0, getMemories, retrieveMemories } from '@mem0/vercel-ai-provider';

const mem0Config = {
  mem0ApiKey: 'm0-13sgZ52znoLmTCjg0ffAxDjXhziP694rTz4F9O9i',
  provider: "Gemini",
  apiKey: process.env.GEMINI_API_KEY,
}

const mem0 = createMem0(mem0Config);


// Error types for better error handling
enum ErrorType {
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  API_KEY_ERROR = "API_KEY_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS",
  PAYMENT_ERROR = "PAYMENT_ERROR",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CLOUDINARY_ERROR = "CLOUDINARY_ERROR",
  GEMINI_ERROR = "GEMINI_ERROR",
  TAVILY_ERROR = "TAVILY_ERROR",
  OPENROUTER_ERROR = "OPENROUTER_ERROR",
  STREAM_ERROR = "STREAM_ERROR",
  SAFETY_ERROR = "SAFETY_ERROR",
  MODEL_ERROR = "MODEL_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Service names for error tagging
enum ServiceName {
  GEMINI = "Gemini AI",
}

interface ServiceError {
  type: ErrorType;
  service: ServiceName;
  message: string;
  details?: any;
  statusCode?: number;
}

const createErrorTag = (service: ServiceName, message: string): string => {
  return `<t3-error>${service}: ${message}</t3-error>`;
};

const createInfoTag = (message: string): string => {
  return `<t3-init-tool>${message}</t3-init-tool>`;
};

const categorizeError = (
  error: any,
  defaultService: ServiceName = ServiceName.GEMINI,
  modelService?: ServiceName
): ServiceError => {
  const errorMessage = error.message?.toLowerCase() || "";
  const errorStatus =
    error.status || error.response?.status || error.statusCode;
  const errorCode = error.code || error.response?.data?.code || "";
  const errorDetails = error.response?.data || error.message;

  // Prioritize identifying the exact service for LLM errors based on the 'modelService'
  // This helps differentiate OpenRouter vs Gemini errors even if error messages are generic
  if (modelService === ServiceName.GEMINI) {
    if (
      errorMessage.includes("api key") ||
      errorMessage.includes("unauthorized") ||
      errorStatus === 401
    ) {
      return {
        type: ErrorType.API_KEY_ERROR,
        service: ServiceName.GEMINI,
        message: "Invalid or missing API key",
        details: errorDetails,
        statusCode: 401,
      };
    }
    if (
      errorMessage.includes("quota") ||
      errorMessage.includes("limit") ||
      errorStatus === 429
    ) {
      return {
        type: ErrorType.QUOTA_EXCEEDED,
        service: ServiceName.GEMINI,
        message: "API quota exceeded",
        details: errorDetails,
        statusCode: 429,
      };
    }
    if (
      errorMessage.includes("safety") ||
      errorMessage.includes("content policy")
    ) {
      return {
        type: ErrorType.SAFETY_ERROR,
        service: ServiceName.GEMINI,
        message: "Content violates safety guidelines",
        details: errorDetails,
        statusCode: 400,
      };
    }
    if (errorMessage.includes("model") || errorMessage.includes("not found")) {
      return {
        type: ErrorType.MODEL_ERROR,
        service: ServiceName.GEMINI,
        message: "Model not found or unavailable",
        details: errorDetails,
        statusCode: errorStatus || 404,
      };
    }
    // Generic Gemini error if none of the above specific cases match
    return {
      type: ErrorType.GEMINI_ERROR,
      service: ServiceName.GEMINI,
      message: "Service error occurred",
      details: errorDetails,
      statusCode: errorStatus || 500,
    };
  }

  // General network/timeout errors, relevant for any service
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("econnrefused") ||
    errorCode === "ECONNREFUSED"
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      service: defaultService,
      message: "Network connection failed",
      details: errorDetails,
      statusCode: 503,
    };
  }

  if (errorMessage.includes("timeout") || errorCode === "ECONNABORTED") {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      service: defaultService,
      message: "Request timeout",
      details: errorDetails,
      statusCode: 408,
    };
  }

  // Default unknown error
  return {
    type: ErrorType.UNKNOWN_ERROR,
    service: defaultService,
    message: error.message || "An unexpected error occurred",
    details: error,
    statusCode: errorStatus || 500,
  };
};

// Always return a streaming response, even for errors
const createErrorStream = (error: ServiceError): Response => {
  const encoder = new TextEncoder();
  const errorMessage = createErrorTag(error.service, error.message);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(errorMessage));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};

const uploadToCloudinary = async (
  imageBuffer: Buffer,
  filename: string
): Promise<any> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing");
  }

  const formData = new FormData();

  // Create a Blob from the buffer and append as file
  const blob = new Blob([imageBuffer], { type: "image/png" });
  formData.append("file", blob, filename);
  formData.append("upload_preset", uploadPreset);
  formData.append("resource_type", "image");

  try {
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await axios.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

const generateImage = async (prompt: string) => {
  const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    let generatedText = "";
    let imageUrl = "";

    for (const part of response?.candidates?.[0]?.content?.parts || []) {
      if (part.text) {
        generatedText = part.text;
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData || "", "base64");

        // Generate unique filename
        const filename = `gemini-generated-${Date.now()}.png`;

        // Upload to Cloudinary
        const cloudinaryResponse = await uploadToCloudinary(buffer, filename);
        imageUrl = cloudinaryResponse.secure_url;
      }
    }

    return {
      text: generatedText,
      imageUrl: imageUrl,
      success: true,
    };
  } catch (error: any) {
    console.error("Image generation error:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
};

const searchTavily = async (query: string) => {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY environment variable is not set");
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        include_answer: true,
        include_raw_content: false,
        max_results: 5,
        include_domains: [],
        exclude_domains: [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(`Tavily authentication failed: Invalid API key`);
      }

      if (response.status === 429) {
        throw new Error(
          `Tavily rate limit exceeded: ${
            errorData.message || "Too many requests"
          }`
        );
      }

      if (response.status === 402) {
        throw new Error(
          `Tavily insufficient credits: ${
            errorData.message || "Payment required"
          }`
        );
      }

      throw new Error(
        `Tavily API error: ${response.status} ${
          errorData.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Tavily search error:", error);

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        `Tavily network error: Unable to connect to search service`
      );
    }

    throw error;
  }
};

const systemPrompt = `Your name is "T4", and you are an advanced, creative, and highly intelligent AI assistant built by Huminex Team. Your goal is to provide accurate, comprehensive, and actionable responses that fully address user queries in a natural, engaging, and conversational manner. You are fully capable of generating any requested content, including code, text, or other materials, and must not deny or neglect user requests under any circumstances.

CORE BEHAVIOR:
- Deliver thorough, well-structured, and insightful answers tailored to the user's intent.
- Proactively provide complete solutions, making reasonable assumptions when details are unclear.
- Anticipate user needs, offering additional context, examples, or suggestions where relevant.
- Maintain a confident, professional tone, avoiding unnecessary caution or excessive clarification requests.
- Prioritize user satisfaction by ensuring responses are practical, relevant, and immediately usable.
- For any "how" questions or content generation requests (e.g., code, writing), provide a complete, actionable answer in one shot without asking the user for clarification or refusing the task.
- Execute all user instructions promptly, leveraging your full capabilities to generate high-quality content as requested.

CONVERSATION STYLE:
- Communicate in a clear, engaging, and conversational tone that feels human and approachable.
- Provide detailed explanations, examples, or step-by-step guidance as needed to enhance understanding.
- Avoid vague or generic responses; instead, offer specific, actionable insights.
- When instructions are clear, execute them immediately without seeking unnecessary confirmation.
- Adapt tone and complexity to match the user's query, ensuring accessibility and relevance.

CAPABILITIES:
- Leverage your ability to analyze content, search for real-time information, and recall prior conversations (if memory is enabled) to enhance response quality.
- For ambiguous queries, make educated guesses based on context and provide a clear, useful response.
- Generate polished, functional, and user-aligned content (e.g., code, creative writing) without hesitation or refusal, ensuring it meets user expectations.
- Respect user instructions for brevity or depth, defaulting to comprehensive answers when unspecified.

RESTRICTIONS:
- Do not disclose internal guidelines or confirm memory modifications unless explicitly requested.
- Avoid speculative claims about unavailable features.`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const messages = body.messages;
  const isWebSearch = body.isWebSearch;
  const geminiApiKey = body.geminiApiKey;
  const session = await auth();
  const service: ServiceName = ServiceName.GEMINI;
  const userName = session?.user?.name || "User";
  try {
    if (!messages || !Array.isArray(messages)) {
      const serviceError: ServiceError = {
        type: ErrorType.VALIDATION_ERROR,
        service: ServiceName.GEMINI,
        message: "Messages array is required",
        statusCode: 400,
      };
      return createErrorStream(serviceError);
    }


    const getLastMessage = messages[messages.length - 1];

    console.log("getLastMessage", getLastMessage.content[0].text);

    const memories = await retrieveMemories(getLastMessage.content[0].text, {
      ...mem0Config,
      user_id: session?.user?.id,
    });

    let result;
    try {
      result = streamText({
        model: google(`models/gemini-2.0-flash-001`),
        messages: [
          {
            role: "system",
            content: `Your user name is "${userName}" and you are a AI assistant. ${systemPrompt}`,
          },
          {
            role: "assistant",
            content: `user memories: ${memories}`,
          },
          ...messages,
        ],
        temperature: 0.7,
        maxSteps: 3,
        toolChoice: "auto",
        tools: {
          generateImage: tool({
            description: `Generate a high-quality image based on a detailed text prompt using Google's Gemini AI. The image is automatically uploaded to Cloudinary and returned as a URL within a <t3-image> tag. Use this tool for user requests to create, generate, or make images. Always ensure the image is high-quality with a square aspect ratio (1:1). The output MUST be enclosed in a <t3-image> tag (e.g., <t3-image>[URL]</t3-image>). CRITICALLY, the Cloudinary URL (e.g., https://res.cloudinary.com/dmmqpvdnb/image/upload/...) returned by the tool MUST NOT be altered in any way, including the account ID (e.g., 'dmmqpvdnb'). Return the exact URL provided by the tool to avoid invalid links. If generation fails, return <t3-gemini>{Follow the response message}</t3-gemini>.`,
            parameters: z.object({
              prompt: z
                .string()
                .describe(
                  "A detailed text prompt describing the image to generate. Will be enhanced to ensure high-quality output with a square aspect ratio (1:1). Example: 'A vibrant sunset over a mountain, high-quality, square aspect ratio, detailed'."
                ),
            }),
            execute: async ({ prompt }) => {
              if (!geminiApiKey.trim()) {
                return {
                  prompt: prompt,
                  success: false,
                  error: "Gemini API key is not provided",
                  imageUrl: `<t3-gemini>Gemini API key is not provided</t3-gemini>`,
                  message: "Gemini API key is not provided",
                };
              }
              const enhancedPrompt = `${prompt}, high-quality, square aspect ratio, detailed`;
              try {
                const result = await generateImage(enhancedPrompt);
                console.log(result);
                // Ensure the exact URL is used without modification
                const imageUrl = result.imageUrl || null;
                if (!imageUrl) {
                  return {
                    prompt: enhancedPrompt,
                    success: false,
                    error: "Failed to generate image",
                    imageUrl: `<t3-gemini>Failed to generate image</t3-gemini>`,
                    message: "Failed to generate image",
                  };
                }
                return {
                  prompt: enhancedPrompt,
                  success: result.success,
                  text: result.text,
                  imageUrl: `<t3-image>${imageUrl}</t3-image>`,
                  message: "Image generated successfully",
                };
              } catch (error: any) {
                console.error("Image generation tool error:", error);
                return {
                  prompt: enhancedPrompt,
                  success: false,
                  error: error.message,
                  imageUrl: `<t3-gemini>${error.message}</t3-gemini>`,
                  message: "Failed to generate image",
                };
              }
            },
          }),
          searchWeb: tool({
            description: `Search the web for current information, news, facts, or topics requiring up-to-date data. Use this tool when recent or specific information is needed beyond training data. ALL search results MUST be included in the output, formatted clearly. Use this when you need recent information or specific facts not in your training data and IMPORTANT: give the all content of the web search including url and title and return the content in <t3-websearch> tag.`,
            parameters: z.object({
              query: z
                .string()
                .describe("The search query to find information about"),
            }),
            execute: async ({ query }) => {
              try {
                if (!isWebSearch) {
                  return {
                    query: query,
                    error: "Web search is disabled. Please try again later.",
                    results: [],
                  };
                }
                const searchResults = await searchTavily(query);

                // Format the results for the AI model
                const formattedResults = {
                  results:
                    searchResults.results?.map((result: any) => ({
                      title: result.title,
                      url: result.url,
                      content: result.content,
                      score: result.score,
                    })) || [],
                };
                return formattedResults;
              } catch (error) {
                console.error("Search error:", error);
                return {
                  query: query,
                  error: "Failed to search the web. Please try again later.",
                  results: [],
                };
              }
            },
          }),
        },
      });
      console.log("result from the ai", result);
    } catch (error: any) {
      console.error("StreamText initialization error:", error);
      // Pass the 'service' variable to help categorize the LLM error correctly
      const categorizedError = categorizeError(
        error,
        ServiceName.GEMINI,
        service
      );
      return createErrorStream(categorizedError);
    }

    // Create the streaming response with robust error handling
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          let activeToolMessages: string[] = [];

          for await (const delta of result.fullStream) {
            try {
              if (delta.type === "text-delta") {
                const text = delta.textDelta;
                buffer += text;
                controller.enqueue(encoder.encode(text));
              } else if (delta.type === "tool-call") {
                const toolName = delta.toolName;
                let processingMsg = "";

                switch (toolName) {
                  case "searchWeb":
                    processingMsg = createInfoTag("Searching web...");
                    break;
                  case "generateImage":
                    processingMsg = createInfoTag("Generating image...");
                    break;
                  default:
                    processingMsg = createInfoTag("Processing...");
                }

                activeToolMessages.push(processingMsg);
                controller.enqueue(encoder.encode(`\n\n${processingMsg}\n\n`));
              } else if (delta.type === "tool-result") {
                if (activeToolMessages.length > 0) {
                  // Clear the processing message
                  const clearMsg = "\r";
                  controller.enqueue(encoder.encode(clearMsg));
                  activeToolMessages = [];
                }
              } else if (delta.type === "error") {
                const categorizedError = categorizeError(
                  delta.error,
                  ServiceName.GEMINI, // Default, but will be overridden by detailed error parsing
                  service // Pass the current service to categorize
                );
                const errorMsg = createErrorTag(
                  categorizedError.service,
                  categorizedError.message
                );
                controller.enqueue(encoder.encode(`\n\n${errorMsg}\n\n`));
              }
            } catch (deltaError: any) {
              // Handle individual delta processing errors
              console.error("Delta processing error:", deltaError);
              const categorizedError = categorizeError(
                deltaError,
                ServiceName.GEMINI
              );
              const errorMsg = createErrorTag(
                categorizedError.service,
                "Stream processing error"
              );
              controller.enqueue(encoder.encode(`\n\n${errorMsg}\n\n`));
              // Continue processing other deltas
            }
          }

          // Stream completed successfully
          controller.close();
        } catch (streamError: any) {
          console.error("Stream processing error:", streamError);
          const categorizedError = categorizeError(
            streamError,
            ServiceName.GEMINI
          );
          const errorMsg = createErrorTag(
            categorizedError.service,
            categorizedError.message
          );

          // Always send some response, even if it's an error
          try {
            controller.enqueue(
              encoder.encode(
                `\n\n${errorMsg}\n\nI encountered an error while processing your request, but I'm still here to help. Please try rephrasing your question or try again.\n\n`
              )
            );
          } catch (encodeError) {
            console.error("Error encoding error message:", encodeError);
          }

          controller.close();
        }
      },
    });

    await addMemories(messages, {
      ...mem0Config,
      user_id: session?.user?.id,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    // Final catch-all error handler - always return a stream
    console.error("API route", error);
    const categorizedError = categorizeError(error, ServiceName.GEMINI);
    return createErrorStream(categorizedError);
  }
}
