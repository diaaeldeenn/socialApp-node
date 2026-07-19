import mongoose, { Document, Types, model } from "mongoose";
import {
  CommentAvalability,
  PostPrivacy,
} from "../../common/enum/post.enum.js";

export interface PostI extends Document {
  content?: string;
  attachments?: string[];
  shares?: Types.ObjectId[];
  tags?: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  allowComments?: CommentAvalability;
  postPrivacy?: PostPrivacy;
  folderId: string;
}

const postSchema = new mongoose.Schema<PostI>(
  {
    content: {
      type: String,
      trim: true,
      required: function (this) {
        return !this.attachments?.length;
      },
    },
    attachments: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    shares: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    tags: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    allowComments: {
      type: String,
      enum: CommentAvalability,
      default: CommentAvalability.allow,
    },
    postPrivacy: {
      type: String,
      enum: PostPrivacy,
      default: PostPrivacy.public,
    },
    folderId: String,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "refId",
});

const postModel = mongoose.models.Post || model<PostI>("Post", postSchema);
export default postModel;
