'use server';
import mongoose, { Document } from "mongoose";

export interface MessageType extends Document {
  threadId: string;
  userId: string;
  attachment: string;
  isSearch: boolean;
  userQuery: string;
  aiResponse: [
    {
        content: string;
        model: string;
    }
  ];
  createdAt: Date;
}