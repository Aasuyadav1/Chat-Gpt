'use server';
import mongoose, { Schema } from "mongoose";
import { MessageType } from "@/types/message.type";

const MessageSchema = new Schema<MessageType>(
  {
    threadId: {
        type:String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    userQuery: {
        type: String,
        required: true,
        trim: true
    },
    attachment: {
        type: String,
    },
    isSearch: {
        type: Boolean,
        default: false
    },
    aiResponse: [
        {
            content: {
                type: String,
                required: true
            },
            model: {
                type: String,
                required: true
            }
        }
    ]
  },
  { timestamps: true }
);

const Message = mongoose.models?.Message || mongoose.model<MessageType>("Message", MessageSchema);

export default Message;