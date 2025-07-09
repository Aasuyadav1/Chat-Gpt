"use server";
import { auth } from "@/auth";
import Message from "@/db/models/message.model";
import { serializeData } from "@/lib/serialize-data";
import Thread from "@/db/models/thread.model";
import { connectDB } from "@/db/db";
import { createThread } from "./thread.action";

export const updateSelectedText = async ({
  messageId,
  subMessageId,
  content,
}: {
  messageId: string;
  subMessageId: string;
  content: string;
}) => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }

  try {
    await connectDB();

    const message = await Message.findOne({
      _id: messageId,
      userId: session.user.id,
    });

    if (!message) {
      return {
        data: null,
        error: "Message not found",
      };
    }

    // Find and update the specific AI response in the aiResponse array
    const aiResponseIndex = message.aiResponse.findIndex(
      (aiRes: any) =>
        aiRes._id.toString() === subMessageId || aiRes._id === subMessageId
    );

    if (aiResponseIndex === -1) {
      return {
        data: null,
        error: "AI response not found",
      };
    }

    // Update the content of the specific AI response
    message.aiResponse[aiResponseIndex].content = content;

    // Mark the aiResponse array as modified for MongoDB
    message.markModified("aiResponse");

    await message.save();

    return {
      data: serializeData(message),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to update message",
    };
  }
};

export const getMessages = async ({ _id }: { _id: string }) => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }

  try {
    await connectDB();

    // Find the current thread
    const thread = await Thread.findOne({
      _id: _id,
      userId: session.user.id,
    });

    if (!thread) {
      return {
        data: null,
        error: "Thread not found",
      };
    }

    const currentMessages = await Message.find({
      threadId: _id,
    }).sort({ createdAt: 1 });


    if (currentMessages.length == 0) {
      return {
        data: null,
        error: "No messages found",
      };
    } 

    return {
      data: serializeData(currentMessages),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "An error occurred while fetching messages",
    };
  }
};

export const createMessage = async ({
  threadId,
  userQuery,
  isNewThread,
  aiResponse,
  attachment,
}: {
  threadId: string;
  userQuery: string;
  isNewThread?: boolean;
  aiResponse: { content: string; model: string }[];
  attachment?: string;
}) => {
  const session = await auth();
  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }
  try {
    await connectDB();

    if (isNewThread) {
      const newThread = await createThread({
        _id: threadId,
        title: userQuery,
      });
    }

    const thread = await Thread.findOne({
      _id: threadId,
      userId: session.user.id,
    });

    if (!thread) {
      return {
        data: null,
        error: "Thread not found",
      };
    }
    const message = await Message.create({
      threadId,
      userId: session.user.id,
      userQuery,
      aiResponse,
      attachment: attachment || "",
    });
    return {
      data: serializeData(message),
      error: null,
    };
  } catch (error: any) {
    console.log(error);
    return {
      data: null,
      error: error.message || "Failed to create message",
    };
  }
};

export const regenerateAnotherResponse = async ({
  messageId,
  aiResponse,
}: {
  messageId: string;
  aiResponse: { content: string; model: string };
}) => {
  const session = await auth();
  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }
  try {
    await connectDB();

    const message = await Message.findOne({
      _id: messageId,
      userId: session.user.id,
    });

    if (!message) {
      return {
        data: null,
        error: "Message not found",
      };
    }

    await message.aiResponse.push(aiResponse);

    await message.save();

    return {
      data: serializeData(message),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to regenerate response",
    };
  }
};

export const deleteMessage = async ({
  messageId,
}: {
  messageId: string;
}) => {
  const session = await auth();
  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }
  try {
    await connectDB();

    await Message.findOneAndDelete({
      _id: messageId,
      userId: session.user.id,
    });

    return {
      data: "Message deleted successfully",
      error: null,
    };
  } catch (error: any) {
    console.log("error in delete message", error);
    return {
      data: null,
      error: error.message || "Failed to delete message",
    };
  }
}