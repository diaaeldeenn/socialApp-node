import mongoose, { Document, Types, model } from "mongoose";
import { ON_Model } from "../../common/enum/post.enum.js";

export interface CommentI extends Document {
  content?: string;
  attachments?: string[];
  tags?: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  folderId: string;
  refId: Types.ObjectId;
  onModel: ON_Model;
}

const commentSchema = new mongoose.Schema<CommentI>(
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
    tags: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    refId:{type:Types.ObjectId,refPath:"onModel",required:true},
    onModel:{type:String,enum:ON_Model,required:true},
    folderId: String,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);


commentSchema.virtual("replies",{
  ref:"Comment",
  localField:"_id",
  foreignField:"refId"
})

const commentModel =
  mongoose.models.Comment || model<CommentI>("Comment", commentSchema);
export default commentModel;
