import type { NextFunction, Request, Response } from "express";
import { type UserI } from "../../DB/models/user.model.js";
import { Types, type Model } from "mongoose";
import type { SignupI } from "../../common/middleware/schema/auth.schema.js";
import UserRepository from "../../DB/repository/user.repository.js";
import {
  CompareHash,
  Hash,
} from "../../common/utils/security/hash.security.js";
import {
  decrypt,
  encrypt,
} from "../../common/utils/security/encrypt.security.js";
import { successResponse } from "../../common/utils/global/response.success.js";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email.js";
import { email_Template } from "../../common/utils/email/email.template.js";
import { AppError } from "../../common/utils/global/response.error.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import  RedisService  from "../../common/service/redis.service.js";
import { sendEmailOtp } from "../../common/utils/email/email.otp.js";

class Authservice {
  private readonly _userModel = new UserRepository();
  private readonly _redisService = RedisService;
  constructor() {}

  signup = async (req: Request, res: Response, next: NextFunction) => {
    let { userName, email, password, age, address, gender, phone }: SignupI =
      req.body;
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
      } as Partial<UserI>);
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
    } catch (error) {
      next(error);
    }
  };

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
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

  resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await this._userModel.findOne({
      filter: { email, confirmed: false },
    });
    if (!user) {
      throw new Error("User Not Exist Or Already Confirmed");
    }
    await sendEmailOtp(email);
    successResponse({ res, message: "Otp Resend Succefully!" });
  };

  signIn = async (req: Request, res: Response, next: NextFunction) => {
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
      const token = jwt.sign({ userId: user._id }, process.env.JWT_TOKEN!, {
        expiresIn: "1h",
        jwtid: uuid,
      });
      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_TOKEN!,
        {
          expiresIn: "1y",
          jwtid: uuid,
        },
      );
      successResponse({
        res,
        message: "LogIn Succefully",
        data: { token, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  };
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshtoken } = req.headers;
      if (!refreshtoken || typeof refreshtoken !== "string") {
        throw new AppError("Token Not Provided", 401);
      }
      const decoded = jwt.verify(refreshtoken, process.env.JWT_REFRESH_TOKEN!);
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
      const token = jwt.sign({ userId: user._id }, process.env.JWT_TOKEN!, {
        expiresIn: "1h",
      });
      successResponse({
        res,
        data: token,
      });
    } catch (error) {
      if (!(error instanceof AppError)) {
        return next(new AppError("Internal Server Error", 500));
      }
      return next(error);
    }
  };
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      successResponse({
        res,
        data: { ...req.user!.toObject(), phone: decrypt(req.user!.phone!) },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { firstName, lastName, gender, phone, age } = req.body;
      if (phone) {
        phone = encrypt(phone);
      }
      const user = await this._userModel.findOneAndUpdate({
        filter: { _id: req.user!._id },
        update: { firstName, lastName, gender, phone, age },
      });
      if (!user) {
        throw new AppError("User Not Exist");
      }
      successResponse({
        res,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { oldPassword, newPassword } = req.body;
      if (
        !CompareHash({ plainText: oldPassword, cipherText: req.user!.password })
      ) {
        throw new Error("Invalid old Password", { cause: 400 });
      }
      const hashNewPassword = Hash({ plainText: newPassword });
      req.user!.password = hashNewPassword;
      await req.user!.save();
      successResponse({ res });
    } catch (error) {
      next(error);
    }
  };
}

export default new Authservice();
