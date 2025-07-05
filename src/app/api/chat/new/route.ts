import { NextRequest, NextResponse } from "next/server";
import { generateText, streamText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { GoogleGenAI, Modality } from "@google/genai";
import axios from "axios";
import { auth } from "@/auth";

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
  console.log(body);
  const messages = body.messages;
  const service = google(`models/gemini-2.0-flash-001`);
  try {
    let result;
    try {
      result = streamText({
        model: service,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
        temperature: 0.7,
      });
    } catch (error: any) {
      console.error("StreamText initialization error:", error);
      return NextResponse.json(
        { error: "Failed to initialize stream" },
        { status: 500 }
      );
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

                activeToolMessages.push(processingMsg);
                controller.enqueue(encoder.encode(`\n\n${processingMsg}\n\n`));
              }
            } catch (deltaError: any) {
              // Handle individual delta processing errors
              console.error("Delta processing error:", deltaError);
              controller.enqueue(
                encoder.encode(`\n\n${deltaError.message}\n\n`)
              );
              // Continue processing other deltas
            }
          }

          // Stream completed successfully
          controller.close();
        } catch (streamError: any) {
          console.error("Stream processing error:", streamError);

          // Always send some response, even if it's an error
          try {
            controller.enqueue(
              encoder.encode(
                `\n\n${streamError.message}\n\nI encountered an error while processing your request, but I'm still here to help. Please try rephrasing your question or try again.\n\n`
              )
            );
          } catch (encodeError) {
            console.error("Error encoding error message:", encodeError);
          }

          controller.close();
        }
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
  } catch (error: any) {
    // Final catch-all error handler - always return a stream
    console.error("API route critical error:", error);
    return NextResponse.json(
      { error: "Failed to initialize stream" },
      { status: 500 }
    );
  }
}
