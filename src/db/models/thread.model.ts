'use server';
import mongoose, { Schema } from "mongoose";
import { ThreadType } from "@/types/thread.type";

const ThreadSchema = new Schema<ThreadType>(
  {
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
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