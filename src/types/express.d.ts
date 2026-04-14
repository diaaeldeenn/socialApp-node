import { UserI } from "../DB/models/user.model.js";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: UserI;
      decoded?: JwtPayload;
    }
  }
}