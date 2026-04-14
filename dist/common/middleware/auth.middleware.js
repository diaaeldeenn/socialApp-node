import jwt from "jsonwebtoken";
import { AppError } from "../utils/global/response.error.js";
import UserRepository from "../../DB/repository/user.repository.js";
import { Types } from "mongoose";
const userRepo = new UserRepository();
export const authentication = async (req, res, next) => {
    try {
        const { token } = req.headers;
        if (!token || typeof token !== "string") {
            throw new AppError("Token Not Provided", 401);
        }
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        if (typeof decoded === "string") {
            throw new AppError("Invalid Token", 401);
        }
        const userId = decoded.userId;
        if (!Types.ObjectId.isValid(userId)) {
            throw new AppError("Invalid Token Payload", 401);
        }
        const user = await userRepo.findById(userId);
        if (!user) {
            throw new AppError("User Not Found", 404);
        }
        req.user = user;
        req.decoded = decoded;
        next();
    }
    catch (error) {
        if (!(error instanceof AppError)) {
            return next(new AppError("Internal Server Error", 500));
        }
        return next(error);
    }
};
export const authorization = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError("User not authenticated", 401);
        }
        if (!roles.includes(req.user.role)) {
            throw new AppError("You don't have permission", 403);
        }
        next();
    };
};
