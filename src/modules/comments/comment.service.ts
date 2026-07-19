import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/global/response.success.js";
import { AppError } from "../../common/utils/global/response.error.js";
import RedisService from "../../common/service/redis.service.js";
import { S3Service } from "../../common/service/s3.service.js";
import PostRepository, {
  getPrivacyFilter,
} from "../../DB/repository/post.repository.js";
import { Types } from "mongoose";
import NotificationService from "../../common/service/notification.service.js";
import UserRepository from "../../DB/repository/user.repository.js";
import { Store_Enum } from "../../common/enum/multer.enum.js";
import { ON_Model } from "../../common/enum/post.enum.js";
import { randomUUID } from "node:crypto";
import { CommentAvalability } from "../../common/enum/post.enum.js";
import CommentRepository from "../../DB/repository/comment.repository.js";
import FriendShipRepository from "../../DB/repository/friendShip.repository.js";
import type {
  CreateCommentI,
  UpdateCommentI,
} from "../../common/middleware/schema/comment.schema.js";
import type { HydratedDocument } from "mongoose";
import type { PostI } from "../../DB/models/post.model.js";
import type { CommentI } from "../../DB/models/comment.model.js";
import ReactRepository from "../../DB/repository/react.repository.js";
import { reactEnum } from "../../common/enum/react.enums.js";

class CommentService {
  private readonly _postModel = new PostRepository();
  private readonly _userModel = new UserRepository();
  private readonly _commentModel = new CommentRepository();
  private readonly _friendshipModel = new FriendShipRepository();
  private readonly _reactModel = new ReactRepository();
  private readonly _redisService = RedisService;
  private readonly _se3 = new S3Service();
  private readonly _notificationService = NotificationService;
  constructor() {}

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId, commentId }: Partial<CreateCommentI> = req.params as {
        postId: string;
        commentId: string;
      };
      const { content, tags, onModel }: CreateCommentI = req.body;
      const currentUserId = req.user?._id as Types.ObjectId | undefined;

      const friendsIds = currentUserId
        ? await this._friendshipModel.getUserFriendsIds(currentUserId)
        : [];

      let doc: HydratedDocument<PostI | CommentI> | null = null;
      if (onModel === ON_Model.Post && !commentId) {
        const post = await this._postModel.findOne({
          filter: {
            _id: postId,
            ...getPrivacyFilter(req, friendsIds),
            allowComments: CommentAvalability.allow,
          },
        });
        if (!post) {
          throw new AppError("Post Not Found");
        }
        doc = post;
      } else if (onModel === ON_Model.Comment && commentId) {
        const comment = await this._commentModel.findOne({
          filter: {
            _id: commentId,
            refId: postId,
          },
          options: {
            populate: [
              {
                path: "refId",
                match: {
                  ...getPrivacyFilter(req, friendsIds),
                  allowComment: CommentAvalability.allow,
                },
              },
            ],
          },
        });
        if (!comment?.refId) {
          throw new AppError("Comment Not Found");
        }
        doc = comment;
      }

      if (!doc) {
        throw new AppError("Invalid onModel Value", 400);
      }

      let idMentions: Types.ObjectId[] = [];
      let fcmTokens: string[] = [];

      if (tags?.length) {
        const mentions = await this._userModel.find({
          filter: {
            _id: { $in: tags },
          },
        });

        if (tags.length !== mentions.length) {
          throw new AppError("Invalid tag id");
        }

        idMentions = mentions.map((user) => user._id);

        const tokenPromises = mentions.map((user) =>
          this._redisService.getFCMs({
            userId: user._id,
          }),
        );

        const tokens = await Promise.all(tokenPromises);

        fcmTokens = tokens.flat();
      }
      let urls: string[] = [];
      let folderId = randomUUID();
      if (req?.files) {
        urls = await this._se3.uploadFiles({
          files: req.files as Express.Multer.File[],
          path: `user/${req?.user?._id}/posts/${doc?.folderId}/comments/${folderId}`,
          storeType: Store_Enum.memory,
        });
      }

      const comment = await this._commentModel.create({
        attachments: urls,
        content: content!,
        createdBy: req?.user?._id!,
        tags: idMentions,
        folderId,
        refId: doc?._id!,
        onModel,
      });
      if (!comment) {
        await this._se3.deleteFiles(urls);
        throw new AppError("Failed To Create Comment");
      }
      if (fcmTokens?.length) {
        await this._notificationService.sendNotifications({
          tokens: fcmTokens,
          data: {
            title: `You Are Mention On New Comment`,
            body: content || "New Comment",
          },
        });
      }
      successResponse({
        res,
        message: "Comment Created Succefully",
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  };

  getComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params as { postId: string };
      const currentUserId = req.user?._id as Types.ObjectId | undefined;

      const friendsIds = currentUserId
        ? await this._friendshipModel.getUserFriendsIds(currentUserId)
        : [];

      const comments = await this._commentModel.find({
        filter: {
          refId: postId,
          onModel: ON_Model.Post,
          ...getPrivacyFilter(req, friendsIds),
        },
        options: {
          populate: [
            {
              path: "replies",
            },
          ],
        },
      });

      successResponse({ res, data: comments });
    } catch (error) {
      next(error);
    }
  };

  reactOnComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params as { commentId: string };
      const { reactType }: { reactType: reactEnum } = req.body;
      const currentUserId = req.user?._id as Types.ObjectId;

      if (!Object.values(reactEnum).includes(reactType)) {
        throw new AppError(
          `Invalid reaction type. Allowed values are: ${Object.values(reactEnum).join(", ")}`,
          400,
        );
      }

      const comment = await this._commentModel.findOne({
        filter: { _id: commentId },
      });

      if (!comment) {
        throw new AppError("Comment Not Found", 404);
      }

      const reactExists = await this._reactModel.findOne({
        filter: {
          ref: new Types.ObjectId(commentId),
          onModel: ON_Model.Comment,
          userId: currentUserId,
        },
      });

      let message = "";
      let updatedReact = null;

      if (reactExists) {
        if (reactExists.type === reactType) {
          await this._reactModel.findOneAndDelete({
            filter: { _id: reactExists._id },
          });
          message = "Reaction removed successfully";
        } else {
          reactExists.type = reactType;
          updatedReact = await reactExists.save();
          message = "Reaction updated successfully";
        }
      } else {
        updatedReact = await this._reactModel.create({
          type: reactType,
          userId: currentUserId,
          ref: new Types.ObjectId(commentId),
          onModel: ON_Model.Comment,
        });
        message = "Reaction added successfully";
      }

      if (message !== "Reaction removed successfully") {
        const ownerFcmToken = await this._redisService.getFCMs({
          userId: comment.createdBy as Types.ObjectId,
        });

        if (comment.createdBy && !comment.createdBy.equals(currentUserId)) {
          if (ownerFcmToken?.length) {
            const senderName = req.user?.userName || "Someone";
            await this._notificationService.sendNotifications({
              tokens: ownerFcmToken,
              data: {
                title: "New Reaction on your comment",
                body: `${senderName} reacted with ${reactType} on your comment`,
              },
            });
          }
        }
      }

      successResponse({ res, message, data: updatedReact });
    } catch (error) {
      next(error);
    }
  };

  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params as { commentId: string };
      const { content, tags, removeTags, removeFiles }: UpdateCommentI =
        req.body;

      const comment = await this._commentModel.findOne({
        filter: { _id: commentId, createdBy: req?.user?._id! },
      });

      if (!comment) {
        throw new AppError("Comment Not Found");
      }

      if (removeFiles?.length) {
        const invalidFiles = removeFiles.filter(
          (file: string) => !comment.attachments?.includes(file),
        );
        if (invalidFiles?.length) {
          throw new AppError("Wrong Files Provided");
        }
        await this._se3.deleteFiles(removeFiles);
        comment.attachments = comment.attachments?.filter(
          (file: string) => !removeFiles.includes(file),
        ) as string[];
      }

      let updateTags = new Set(comment?.tags?.map((id) => id.toString()));
      removeTags?.forEach((tag: string) => updateTags.delete(tag));

      let fcmTokens: string[] = [];
      if (tags?.length) {
        const mentions = await this._userModel.find({
          filter: { _id: { $in: tags } },
        });

        if (tags.length !== mentions.length) {
          throw new AppError("Invalid tag id");
        }

        mentions.forEach((user) => updateTags.add(user._id.toString()));

        const tokenPromises = mentions.map((user) =>
          this._redisService.getFCMs({ userId: user._id }),
        );
        const tokens = await Promise.all(tokenPromises);
        fcmTokens = tokens.flat();

        comment.tags = [...updateTags].map(
          (id: string) => new Types.ObjectId(id),
        );
      }

      if (req?.files) {
        let urls = await this._se3.uploadFiles({
          files: req.files as Express.Multer.File[],
          path: `user/${req?.user?._id}/posts/comments/${comment.folderId}`,
          storeType: Store_Enum.memory,
        });
        comment.attachments?.push(...urls);
      }

      if (fcmTokens?.length && content) {
        await this._notificationService.sendNotifications({
          tokens: fcmTokens,
          data: {
            title: `You Are Mentioned On An Updated Comment`,
            body: content || "Updated Comment",
          },
        });
      }

      if (content) comment.content = content;

      await comment.save();
      successResponse({ res, data: comment });
    } catch (error) {
      next(error);
    }
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params as { commentId: string };
      const currentUserId = req.user?._id as Types.ObjectId;

      const targetComment = await this._commentModel.findOne({
        filter: {
          _id: commentId,
          createdBy: currentUserId,
        },
      });

      if (!targetComment) {
        throw new AppError("Comment Not Found or Unauthorized", 404);
      }

      const allReplyIds = await this._commentModel.getAllReplyIds([
        targetComment._id as Types.ObjectId,
      ]);
      const allCommentIdsToDelete = [
        targetComment._id as Types.ObjectId,
        ...allReplyIds,
      ];

      const allCommentsData = await this._commentModel.find({
        filter: { _id: { $in: allCommentIdsToDelete } },
        options: { select: "attachments" },
      });

      const filesToDelete: string[] = [];
      allCommentsData.forEach((c) => {
        if (c.attachments?.length) {
          filesToDelete.push(...c.attachments);
        }
      });

      if (filesToDelete.length) {
        await this._se3.deleteFiles(filesToDelete);
      }

      await this._commentModel.deleteMany({
        _id: { $in: allCommentIdsToDelete },
      });

      await this._reactModel.deleteMany({
        ref: { $in: allCommentIdsToDelete },
        onModel: ON_Model.Comment,
      });

      successResponse({
        res,
        message: "Comment and its sub-tree deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new CommentService();
