'use server';
import { auth } from "@/auth";
import { connectDB } from "@/db/db";
import { serializeData } from "@/lib/serialize-data";
import Folder from "@/db/models/folder.model";

export const createFolder = async ({
  title,
  context,
}: {
  title: string;
  context?: string;
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

    const folder = await Folder.create({
      title,
      context: context || "",
      userId: session.user.id,
    });

    return {
      data: serializeData(folder),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error.message,
    };
  }
};

export const updateFolder = async ({
  folderId,
  title,
  context,
}: {
  folderId: string;
  title?: string;
  context?: string;
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

    const folder = await Folder.findOne({
      _id: folderId,
      userId: session.user.id,
    });

    if (!folder) {
      return {
        data: null,
        error: "Folder not found",
      };
    }

    if (title !== undefined) {
      folder.title = title;
    }
    if (context !== undefined) {
      folder.context = context;
    }

    await folder.save();

    return {
      data: serializeData(folder),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error.message,
    };
  }
};

export const deleteFolder = async ({ folderId }: { folderId: string }) => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }

  try {
    await connectDB();

    const folder = await Folder.findOne({
      _id: folderId,
      userId: session.user.id,
    });

    if (!folder) {
      return {
        data: null,
        error: "Folder not found",
      };
    }

    await Folder.deleteOne({ _id: folderId });

    return {
      data: serializeData(folder),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error.message,
    };
  }
};