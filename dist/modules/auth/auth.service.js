import {} from "../../DB/models/user.model.js";
import { Types } from "mongoose";
import UserRepository from "../../DB/repository/user.repository.js";
import { OAuth2Client } from "google-auth-library";
import { CompareHash, Hash, } from "../../common/utils/security/hash.security.js";
import { encrypt } from "../../common/utils/security/encrypt.security.js";
import { successResponse } from "../../common/utils/global/response.success.js";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email.js";
import { email_Template } from "../../common/utils/email/email.template.js";
import { AppError } from "../../common/utils/global/response.error.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import RedisService from "../../common/service/redis.service.js";
import { sendEmailOtp } from "../../common/utils/email/email.otp.js";
class Authservice {
    _userModel = new UserRepository();
    _redisService = RedisService;
    constructor() { }
    signup = async (req, res, next) => {
        let { userName, email, password, age, address, gender, phone } = req.body;
        const emailExist = await this._userModel.findOne({ filter: { email } });
        if (emailExist) {
            throw new AppError("Email Already Exist", 409);
        }
        try {
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
            await this._redisService.setValue({
                key: `otp::${email}`,
                value: Hash({ plainText: `${otp}` }),
                ttl: 60 * 2,
            });
            await this._redisService.setValue({
                key: `max_otp::${email}`,
                value: "1",
                ttl: 60 * 5,
            });
            successResponse({ res, message: "Signup Success", data: user });
        }
        catch (error) {
            next(error);
        }
    };
    signUpWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.Client_ID,
        });
        const payload = ticket.getPayload();
        const { email, email_verified, name } = payload;
        if (!email)
            throw new AppError("Email Invalid");
        let user = await this._userModel.findOne({
            filter: { email },
        });
        if (!user) {
            user = await this._userModel.create({
                email,
                userName: name,
                confirmed: email_verified,
                provider: ProviderEnum.google,
            });
        }
        if (user.provider == ProviderEnum.local) {
            throw new Error("Please Log In In System Only", { cause: 400 });
        }
        const token = jwt.sign({ userId: user._id }, "DiaaDiaa", {
            expiresIn: "1h",
        });
        successResponse({
            res,
            message: "LogIn Succefully",
            data: { token: token },
        });
    };
    confirmEmail = async (req, res, next) => {
        const { email, otp } = req.body;
        const otpExist = await this._redisService.getValue(`otp::${email}`);
        if (!otpExist) {
            throw new Error("Otp Expired");
        }
        if (!CompareHash({ plainText: otp, cipherText: otpExist })) {
            throw new Error("Invalid Otp");
        }
        const user = await this._userModel.findOneAndUpdate({
            filter: { email, confirmed: false },
            update: { confirmed: true },
        });
        if (!user) {
            throw new Error("User Not Exist");
        }
        await this._redisService.deleteKey(`otp::${email}`);
        successResponse({ res, message: "Email confirmed Succefully!" });
    };
    resendOtp = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({
            filter: { email },
        });
        if (!user) {
            throw new Error("User Not Exist Or Already Confirmed");
        }
        await sendEmailOtp(email);
        successResponse({ res, message: "Otp Resend Succefully!" });
    };
    signIn = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const user = await this._userModel.findOne({
                filter: {
                    email,
                    provider: ProviderEnum.local,
                    confirmed: true,
                },
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
    forgetPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            const user = await this._userModel.findOne({
                filter: {
                    email,
                    provider: ProviderEnum.local,
                    confirmed: { $exists: true },
                },
            });
            if (!user) {
                throw new Error("User Not Exist", { cause: 409 });
            }
            await sendEmailOtp(email);
            successResponse({ res, message: "Otp Send Succefully" });
        }
        catch (error) {
            next(error);
        }
    };
    confirmPassword = async (req, res, next) => {
        try {
            const { email, otp } = req.body;
            const otpValue = await this._redisService.getValue(`otp::${email}`);
            if (!otpValue) {
                throw new Error("Invalid or Expired OTP");
            }
            if (!CompareHash({ plainText: otp, cipherText: otpValue })) {
                throw new Error("Otp Is Invalid");
            }
            await this._redisService.deleteKey(`otp::${email}`);
            await this._redisService.deleteKey(`max_otp::${email}`);
            await this._redisService.setValue({
                key: `verified_otp::${email}`,
                value: "1",
                ttl: 60 * 5,
            });
            successResponse({ res, message: "Otp Is Valid" });
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            const { email, newPassword } = req.body;
            const isVerified = await this._redisService.getValue(`verified_otp::${email}`);
            if (!isVerified) {
                throw new Error("Otp not verified");
            }
            const user = await this._userModel.findOneAndUpdate({
                filter: {
                    email,
                    provider: ProviderEnum.local,
                    confirmed: { $exists: true },
                },
                update: {
                    password: Hash({ plainText: newPassword }),
                    logOut: new Date(),
                },
            });
            if (!user) {
                throw new Error("User Not Exist", { cause: 409 });
            }
            await this._redisService.deleteKey(`verified_otp::${email}`);
            await this._redisService.deleteKey(`confirm_tries::${email}`);
            successResponse({ res, message: "Password Reset Succefully" });
        }
        catch (error) {
            next(error);
        }
    };
}
export default new Authservice();
