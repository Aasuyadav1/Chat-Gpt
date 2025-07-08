"use server";
import { auth } from "@/auth";
import { getMemories } from '@mem0/vercel-ai-provider';
import { mem0Config } from "@/lib/config";

export const getUserMemories = async () => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized - User not authenticated",
    };
  }

  try {
   
    const memories = await getMemories("retrive all memories", {
        ...mem0Config,
        user_id: session?.user?.id,
      });

    return {
      data: memories,
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching user memories:", error);
    return {
      data: null,
      error: error.message || "Failed to fetch memories",
    };
  }
};
