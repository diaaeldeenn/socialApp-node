import mongoose, { Types, model } from "mongoose";
const MessageSchema = new mongoose.Schema({
    createdBy: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: { type: String, required: true },
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
const ChatSchema = new mongoose.Schema({
    createdBy: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    message: [MessageSchema],
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
const ChatModel = mongoose.models.Chat || model("Chat", ChatSchema);
export default ChatModel;
