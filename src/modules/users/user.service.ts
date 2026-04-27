import type { NextFunction, Request, Response } from "express";
import type {
  updatePasswordI,
  updateProfileI,
} from "../../common/middleware/schema/auth.schema.js";
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
import { AppError } from "../../common/utils/global/response.error.js";

class UserService {
  private readonly _userModel = new UserRepository();
  constructor() {}
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
      let { firstName, lastName, gender, phone, age }: updateProfileI =
        req.body;
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
      let { oldPassword, newPassword }: updatePasswordI = req.body;
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




export default new UserService();
