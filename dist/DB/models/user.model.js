import mongoose, { Document, Schema, Types, model } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum/user.enum.js";
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        min: 2,
        max: 25,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        min: 2,
        max: 25,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
    },
    age: {
        type: Number,
        required: true,
        min: 18,
        max: 100,
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: Object.values(GenderEnum),
        default: GenderEnum.male,
    },
    role: {
        type: String,
        enum: Object.values(RoleEnum),
        default: RoleEnum.user,
    },
    provider: {
        type: String,
        enum: Object.values(ProviderEnum),
        default: ProviderEnum.local,
    },
    confirmed: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema
    .virtual("userName")
    .get(function () {
    return this.firstName + " " + this.lastName;
})
    .set(function (v) {
    const [firstName, lastName] = v.split(" ");
    this.firstName = firstName;
    this.lastName = lastName;
});
const userModel = mongoose.models.User || model("user", userSchema);
export default userModel;
