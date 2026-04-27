import express from "express";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { AppError, globalErrorHandler } from "./common/utils/global/response.error.js";
import authRouter from "./modules/auth/auth.controller.js";
import connectionDB from "./DB/connectionDB.js";
import RedisService from "./common/service/redis.service.js";
import userRouter from "./modules/users/users.controller.js";
const app = express();
const port = Number(process.env.PORT) || 3000;
const bootstrap = async () => {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 200,
        message: "To Many Request Try After 15 Minutes",
        legacyHeaders: false,
    });
    app.use(cors(), helmet(), limiter, express.json());
    connectionDB();
    await RedisService.connect();
    app.get("/", (req, res) => {
        res.status(200).json({ message: "Welcome In My Api" });
    });
    app.use("/auth", authRouter);
    app.use("/user", userRouter);
    app.use("{/*demo}", (req, res) => {
        throw new AppError(`Url ${req.originalUrl} Not Found!`, 404);
    });
    app.use(globalErrorHandler);
    app.listen(port, () => {
        console.log(`Server Is Runing On Port ${port}`);
    });
};
export default bootstrap;
