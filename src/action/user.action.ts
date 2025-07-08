"use server";
import { connectDB } from "@/db/db";
import { serializeData } from "@/lib/serialize-data";
import User from "@/db/models/user.model";
import { auth } from "@/auth";

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