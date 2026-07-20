import mongoose, { Types, model } from "mongoose";

export interface MessageI {
  createdBy: Types.ObjectId;
  content: string;
}
export interface ChatI {
  // OVO
  createdBy: Types.ObjectId;
  message: MessageI[];
  participants: Types.ObjectId[];
}

const MessageSchema = new mongoose.Schema<MessageI>(
  {
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const ChatSchema = new mongoose.Schema<ChatI>(
  {
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    message: [MessageSchema],
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const ChatModel = mongoose.models.Chat || model<ChatI>("Chat", ChatSchema);
export default ChatModel;
