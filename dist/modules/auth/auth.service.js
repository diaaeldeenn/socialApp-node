import {} from "../../DB/models/user.model.js";
import { Types } from "mongoose";
import UserRepository from "../../DB/repository/user.repository.js";
import { CompareHash, Hash, } from "../../common/utils/security/hash.security.js";
import { decrypt, encrypt } from "../../common/utils/security/encrypt.security.js";
import { successResponse } from "../../common/utils/global/response.success.js";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email.js";
import { email_Template } from "../../common/utils/email/email.template.js";
import { AppError } from "../../common/utils/global/response.error.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
class Authservice {
    _userModel = new UserRepository();
    constructor() { }
    signup = async (req, res, next) => {
        let { userName, email, password, age, address, gender, phone } = req.body;
        const emailExist = await this._userModel.findOne({ filter: { email } });
        if (emailExist) {
            throw new AppError("Email Already Exist", 409);
        }
        const user = await this._userModel.create({
            userName,
            email,
            password: Hash({ plainText: password }),
            age,
            address,
            gender,
            phone: phone ? encrypt(phone) : null,
        });
        const otp = await generateOtp();
        await sendEmail({
            to: email,
            subject: "Email Confirmation",
            html: email_Template(otp),
        });
        successResponse({ res, message: "Signup Success", data: user });
    };
    signIn = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const user = await this._userModel.findOne({
                filter: { email, provider: ProviderEnum.local },
            });
            if (!user) {
                throw new AppError("User Not Exist Or Not Confirmed Yet !", 409);
            }
            if (!CompareHash({ plainText: password, cipherText: user.password })) {
                throw new AppError("Invalid Password", 400);
            }
            const uuid = randomUUID();
            const token = jwt.sign({ userId: user._id }, process.env.JWT_TOKEN, {
                expiresIn: "1h",
                jwtid: uuid,
            });
            const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_TOKEN, {
                expiresIn: "1y",
                jwtid: uuid,
            });
            successResponse({
                res,
                message: "LogIn Succefully",
                data: { token, refreshToken },
            });
        }
        catch (error) {
            next(error);
        }
    };
    refreshToken = async (req, res, next) => {
        try {
            const { refreshtoken } = req.headers;
            if (!refreshtoken || typeof refreshtoken !== "string") {
                throw new AppError("Token Not Provided", 401);
            }
            const decoded = jwt.verify(refreshtoken, process.env.JWT_REFRESH_TOKEN);
            if (typeof decoded === "string") {
                throw new AppError("Invalid Token", 401);
            }
            const userId = decoded.userId;
            if (!Types.ObjectId.isValid(userId)) {
                throw new AppError("Invalid Token Payload", 401);
            }
            const user = await this._userModel.findOne({
                filter: { _id: userId },
            });
            if (!user) {
                throw new AppError("User Not Found");
            }
            const token = jwt.sign({ userId: user._id }, process.env.JWT_TOKEN, {
                expiresIn: "1h",
            });
            successResponse({
                res,
                data: token,
            });
        }
        catch (error) {
            if (!(error instanceof AppError)) {
                return next(new AppError("Internal Server Error", 500));
            }
            return next(error);
        }
    };
    getProfile = async (req, res, next) => {
        try {
            successResponse({
                res,
                data: { ...req.user.toObject(), phone: decrypt(req.user.phone) },
            });
        }
        catch (error) {
            console.log(error);
            next(error);
        }
    };
    updateProfile = async (req, res, next) => {
        try {
            let { firstName, lastName, gender, phone, age } = req.body;
            if (phone) {
                phone = encrypt(phone);
            }
            const user = await this._userModel.findOneAndUpdate({
                filter: { _id: req.user._id },
                update: { firstName, lastName, gender, phone, age },
            });
            if (!user) {
                throw new AppError("User Not Exist");
            }
            successResponse({
                res,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    };
    updatePassword = async (req, res, next) => {
        try {
            let { oldPassword, newPassword } = req.body;
            if (!CompareHash({ plainText: oldPassword, cipherText: req.user.password })) {
                throw new Error("Invalid old Password", { cause: 400 });
            }
            const hashNewPassword = Hash({ plainText: newPassword });
            req.user.password = hashNewPassword;
            await req.user.save();
            successResponse({ res });
        }
        catch (error) {
            next(error);
        }
    };
}
export default new Authservice();
