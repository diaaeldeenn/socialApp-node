import mongoose, { Schema, Types } from "mongoose";
import { reactEnum } from "../../common/enum/react.enums.js";
import { ON_Model } from "../../common/enum/post.enum.js";

export interface ReactI {
  userId: Types.ObjectId;
  type: reactEnum;
  onModel: ON_Model;
  ref: Types.ObjectId;
}

const reactSchema = new mongoose.Schema<ReactI>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    type: {
      type: String,
      enum: Object.values(reactEnum),
      required: true,
    },
    onModel: {
      type: String,
      required: true,
      enum: Object.values(ON_Model),
    },
    ref: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "onModel",
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

reactSchema.index(
  {
    userId: 1,
    ref: 1,
    onModel: 1,
  },
  {
    unique: true,
  },
);

reactSchema.index({ ref: 1, onModel: 1 });

const reactModel = mongoose.model<ReactI>("React", reactSchema);
export default reactModel;
