import { createMem0 } from '@mem0/vercel-ai-provider';

export const mem0Config = {
  mem0ApiKey: process.env.MEM0_API_KEY,
  provider: "Gemini",
  apiKey: process.env.GEMINI_API_KEY,
}

export const mem0 = createMem0(mem0Config);