import mongoose, { Types, model } from "mongoose";
import { friendRequestStatus } from "../../common/enum/friend.enum.js";
const friendRequestSchema = new mongoose.Schema({
    from: {
        type: Types.ObjectId,
        required: true,
        ref: "User",
    },
    to: {
        type: Types.ObjectId,
        required: true,
        ref: "User",
    },
    status: {
        type: String,
        enum: friendRequestStatus,
        default: friendRequestStatus.pending,
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
});
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
const friendRequestModel = mongoose.models.friendRequest ||
    model("friendRequest", friendRequestSchema);
export default friendRequestModel;
