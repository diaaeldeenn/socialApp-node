import mongoose, { Types, model } from "mongoose";

export interface FriendshipI {
  userA: Types.ObjectId;
  userB: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new mongoose.Schema<FriendshipI>(
  {
    userA: {
      type: Types.ObjectId,
      required: true,
    },
    userB: {
      type: Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
  },
);

friendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });

const friendshipModel =
  mongoose.models.friendship ||
  model<FriendshipI>("friendship", friendshipSchema);
export default friendshipModel;
