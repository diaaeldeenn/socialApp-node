import { Router } from "express";
import { authentication } from "../../common/middleware/auth.middleware.js";
import ChatService from "./chat.service.js";
const chatRouter = Router({
    caseSensitive: true,
    strict: true,
    mergeParams: true,
});
chatRouter.get("/", authentication, ChatService.getChat);
export default chatRouter;
