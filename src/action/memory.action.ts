"use server";
import { auth } from "@/auth";
import axios from "axios";
import { serializeData } from "@/lib/serialize-data";

export const getUserMemories = async () => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized - User not authenticated",
    };
  }

  try {

    const response = await axios.get(`${process.env.MEM0_API_URL}v1/memories/?user_id=${session.user.id}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${process.env.MEM0_API_KEY}`
      }
    })

    if(response.status !== 200) {
      return {
        data: null,
        error: "Failed to fetch memories",
      }
    }

    return {
      data: serializeData(response.data),
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

export const deleteMemory = async (memoryId: string) => {
  const session = await auth();

  if (!session?.user) {
    return {
      success: false,
      error: "Unauthorized - User not authenticated",
    };
  }

  try {
    const response = await axios.delete(`${process.env.MEM0_API_URL}v1/memories/${memoryId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${process.env.MEM0_API_KEY}`
      }
    });

    if (response.status !== 200 && response.status !== 204) {
      return {
        success: false,
        error: "Failed to delete memory",
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("Error deleting memory:", error);
    return {
      success: false,
      error: error.message || "Failed to delete memory",
    };
  }
};

export const deleteAllMemories = async () => {
  const session = await auth();

  if (!session?.user) {
    return {
      success: false,
      error: "Unauthorized - User not authenticated",
    };
  }

  try {
    const response = await axios.delete(`${process.env.MEM0_API_URL}v1/memories/?user_id=${session.user.id}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${process.env.MEM0_API_KEY}`
      }
    });

    if (response.status !== 200 && response.status !== 204) {
      return {
        success: false,
        error: "Failed to delete all memories",
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("Error deleting all memories:", error);
    return {
      success: false,
      error: error.message || "Failed to delete all memories",
    };
  }
};
