'use server';
import mongoose, { Schema } from "mongoose";
import { FolderType } from "@/types/folder.type";

const FolderSchema = new Schema<FolderType>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    context: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Folder = mongoose.models?.Folder || mongoose.model<FolderType>("Folder", FolderSchema);

export default Folder; 