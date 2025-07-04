'use server';
import mongoose, { Document } from "mongoose";

export interface FolderType extends Document {
  title: string;
  context: string;
  userId: mongoose.Types.ObjectId
}