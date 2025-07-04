'use server';
import mongoose, { Schema } from "mongoose";
import { ThreadType } from "@/types/thread.type";

const ThreadSchema = new Schema<ThreadType>(
  {
    threadId: {
      type: String,
      required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    parentFolderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    title: {
        type: String,
        trim: true,
        required: true,
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
    parentChatId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    shareChatId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

const Thread = mongoose.models?.Thread || mongoose.model<ThreadType>("Thread", ThreadSchema);

export default Thread;