import { Router } from "express";
import { schema } from "../../common/middleware/schema/schema.js";
import { authentication } from "../../common/middleware/auth.middleware.js";
import multerCloud from "../../common/middleware/multer.cloud.js";
import { Store_Enum } from "../../common/enum/multer.enum.js";
import commentService from "./comment.service.js";
import { createCommentSchema, updateCommentSchema } from "../../common/middleware/schema/comment.schema.js";
const commentRouter = Router({
    caseSensitive: true,
    strict: true,
    mergeParams: true,
});
commentRouter.post("/", authentication, multerCloud({ storeType: Store_Enum.memory }).array("attachment"), schema(createCommentSchema), commentService.createComment);
commentRouter.post("/:commentId", authentication, multerCloud({ storeType: Store_Enum.memory }).array("attachment"), schema(createCommentSchema), commentService.createComment);
commentRouter.get("/", authentication, commentService.getComment);
commentRouter.post("/:commentId/react", authentication, commentService.reactOnComment);
commentRouter.put("/:commentId", authentication, schema(updateCommentSchema), commentService.updateComment);
commentRouter.delete("/:commentId", authentication, commentService.deleteComment);
export default commentRouter;
