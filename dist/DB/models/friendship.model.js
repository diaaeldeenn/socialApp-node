import mongoose, { Types, model } from "mongoose";
const friendshipSchema = new mongoose.Schema({
    userA: {
        type: Types.ObjectId,
        required: true,
    },
    userB: {
        type: Types.ObjectId,
        required: true,
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
});
friendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });
const friendshipModel = mongoose.models.friendship ||
    model("friendship", friendshipSchema);
export default friendshipModel;
