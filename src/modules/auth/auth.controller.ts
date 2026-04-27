import { Router } from "express";
import AuthService from "./auth.service.js";
import { schema } from "../../common/middleware/schema/schema.js";
import { confirmEmailSchema, emailSchema, resetPasswordSchema, signInSchema, signUpSchema } from "../../common/middleware/schema/auth.schema.js";


const authRouter = Router({ caseSensitive: true, strict: true });
authRouter.post("/signup",schema(signUpSchema),AuthService.signup);
authRouter.post("/signup/gmail",AuthService.signUpWithGmail);
authRouter.patch("/signup/confirm-email",schema(confirmEmailSchema),AuthService.confirmEmail);
authRouter.post("/signup/resend_otp",schema(emailSchema),AuthService.resendOtp);
authRouter.post("/signin",schema(signInSchema),AuthService.signIn);
authRouter.get("/refreshToken",AuthService.refreshToken);
authRouter.patch("/forgetPassword",schema(emailSchema),AuthService.forgetPassword);
authRouter.post("/confirmPassword",schema(confirmEmailSchema),AuthService.confirmPassword);
authRouter.patch("/resetPassword",schema(resetPasswordSchema),AuthService.resetPassword);



export default authRouter;
