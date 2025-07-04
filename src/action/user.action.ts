"use server";
import { connectDB } from "@/db/db";
import { serializeData } from "@/lib/serialize-data";
import User from "@/db/models/user.model";
import { auth } from "@/auth";

export const createOrUpdateGeminiKey = async (key: string) => {
  const session = await auth();
  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }
  try {
    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return {
        data: null,
        error: "User not found",
      };
    }
    // user.geminiApiKey = key;
    const updatedUser = await user.save();
    return {
      data: serializeData(updatedUser),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error.message,
    };
  }
};

export const getUser = async () => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return {
        data: null,
        error: "User not found",
      };
    }
    return {
      data: serializeData(user),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error.message,
    };
  }
};

export const updateT3ChatInfo = async ({
  username,
  profession,
  skills,
  additionalInfo,
}: {
  username?: string;
  profession?: string;
  skills?: string[];
  additionalInfo?: string;
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

    const user = await User.findById(session.user.id);

    if (!user) {
      return {
        data: null,
        error: "User not found",
      };
    }

    // Initialize t3ChatInfo if it doesn't exist
    if (!user.t3ChatInfo) {
      user.t3ChatInfo = {};
    }

    // Update only provided fields
    if (username !== undefined) {
      user.t3ChatInfo.username = username;
    }
    if (profession !== undefined) {
      user.t3ChatInfo.profession = profession;
    }
    if (skills !== undefined) {
      user.t3ChatInfo.skills = skills;
    }
    if (additionalInfo !== undefined) {
      user.t3ChatInfo.additionalInfo = additionalInfo;
    }

    await user.save();

    return {
      data: serializeData(user.t3ChatInfo),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error.message,
    };
  }
};
