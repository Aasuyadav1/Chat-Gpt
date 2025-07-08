'use server';
import mongoose, { Document } from "mongoose";

export interface ThreadType extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  isPinned: boolean;
  shareChatId?: mongoose.Types.ObjectId | null;
}