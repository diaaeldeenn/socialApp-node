import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/global/response.success.js";
import { AppError } from "../../common/utils/global/response.error.js";
import RedisService from "../../common/service/redis.service.js";
import { S3Service } from "../../common/service/s3.service.js";
import PostRepository, {
  getPrivacyFilter,
} from "../../DB/repository/post.repository.js";
import type {
  CreatePostI,
  UpdatePostI,
} from "../../common/middleware/schema/post.schema.js";
import { Types } from "mongoose";
import NotificationService from "../../common/service/notification.service.js";
import UserRepository from "../../DB/repository/user.repository.js";
import { Store_Enum } from "../../common/enum/multer.enum.js";
import { randomUUID } from "node:crypto";
import CommentRepository from "../../DB/repository/comment.repository.js";
import FriendShipRepository from "../../DB/repository/friendShip.repository.js";
import ReactRepository from "../../DB/repository/react.repository.js";
import { reactEnum } from "../../common/enum/react.enums.js";
import { ON_Model } from "../../common/enum/post.enum.js";

class PostService {
  private readonly _postModel = new PostRepository();
  private readonly _userModel = new UserRepository();
  private readonly _commentModel = new CommentRepository();
  private readonly _friendshipModel = new FriendShipRepository();
  private readonly _reactModel = new ReactRepository();
  private readonly _redisService = RedisService;
  private readonly _se3 = new S3Service();
  private readonly _notificationService = NotificationService;
  constructor() {}

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { allowComments, postPrivacy, content, tags }: CreatePostI =
        req.body;

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
          path: `user/${req?.user?._id}/posts/${folderId}`,
          storeType: Store_Enum.memory,
        });
      }

      const post = await this._postModel.create({
        attachments: urls,
        content: content!,
        createdBy: req?.user?._id!,
        tags: idMentions,
        folderId,
        postPrivacy: postPrivacy!,
        allowComments: allowComments!,
      });
      if (!post) {
        await this._se3.deleteFiles(urls);
        throw new AppError("Failed To Create Post");
      }
      if (fcmTokens?.length) {
        await this._notificationService.sendNotifications({
          tokens: fcmTokens,
          data: {
            title: `You Are Mention On New Post`,
            body: content || "New Post",
          },
        });
      }
      successResponse({ res, message: "Post Created Succefully", data: post });
    } catch (error) {
      next(error);
    }
  };

  getPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = req.query?.search as string | undefined;
      const currentUserId = req.user?._id as Types.ObjectId | undefined;

      const friendsIds = currentUserId
        ? await this._friendshipModel.getUserFriendsIds(currentUserId)
        : [];

      const posts = await this._postModel.pagination({
        page: +req?.query?.page!,
        limit: +req?.query?.limit!,
        search: {
          ...getPrivacyFilter(req, friendsIds),
          ...(search ? { content: { $regex: search, $options: "i" } } : {}),
        },
        populate: [
          {
            path: "comments",
            match: {
              onModel: ON_Model.Post,
            },
          },
        ],
      });

      successResponse({ res, data: posts });
    } catch (error) {
      next(error);
    }
  };

  reactOnPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params as { postId: string };
      const { reactType }: { reactType: reactEnum } = req.body;
      const currentUserId = req.user?._id as Types.ObjectId;

      if (!Object.values(reactEnum).includes(reactType)) {
        throw new AppError(
          `Invalid reaction type. Allowed values are: ${Object.values(reactEnum).join(", ")}`,
          400,
        );
      }

      const friendsIds =
        await this._friendshipModel.getUserFriendsIds(currentUserId);
      const post = await this._postModel.findOne({
        filter: {
          _id: postId,
          ...getPrivacyFilter(req, friendsIds),
        },
      });

      if (!post) {
        throw new AppError("Post Not Found", 404);
      }

      const reactExists = await this._reactModel.findOne({
        filter: {
          ref: new Types.ObjectId(postId),
          onModel: ON_Model.Post,
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
          ref: new Types.ObjectId(postId),
          onModel: ON_Model.Post,
        });
        message = "Reaction added successfully";
      }

      if (message !== "Reaction removed successfully") {
        const ownerFcmToken = await this._redisService.getFCMs({
          userId: post.createdBy as Types.ObjectId,
        });
        if (post.createdBy && !post.createdBy.equals(currentUserId)) {
          if (ownerFcmToken?.length) {
            const senderName = req.user?.userName || "Someone";
            await this._notificationService.sendNotifications({
              tokens: ownerFcmToken,
              data: {
                title: "New Reaction on your post",
                body: `${senderName} reacted with ${reactType} on your post`,
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

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params as { postId: string };
      const {
        allowComments,
        postPrivacy,
        content,
        tags,
        removeTags,
        removeFiles,
      }: UpdatePostI = req.body;

      const post = await this._postModel.findOne({
        filter: { _id: postId, createdBy: req?.user?._id! },
      });

      if (!post) {
        throw new AppError("Post Not Found");
      }

      if (removeFiles?.length) {
        const invalidFiles = removeFiles.filter(
          (file: string) => !post.attachments?.includes(file),
        );
        if (invalidFiles?.length) {
          throw new AppError("Wrong Files");
        }
        await this._se3.deleteFiles(removeFiles);
        post.attachments = post.attachments?.filter(
          (file: string) => !removeFiles.includes(file),
        ) as string[];
      }

      let updateTags = new Set(post?.tags?.map((id) => id.toString()));
      removeTags?.forEach((tag: string) => updateTags.delete(tag));

      let fcmTokens: string[] = [];
      if (tags?.length) {
        const mentions = await this._userModel.find({
          filter: { _id: { $in: tags } },
        });

        if (tags.length !== mentions.length) {
          throw new AppError("Invalid tag id");
        }

        mentions.forEach((user) => {
          updateTags.add(user._id.toString());
        });

        const tokenPromises = mentions.map((user) =>
          this._redisService.getFCMs({ userId: user._id }),
        );

        const tokens = await Promise.all(tokenPromises);
        fcmTokens = tokens.flat();

        post.tags = [...updateTags].map((id: string) => new Types.ObjectId(id));
      }

      if (req?.files) {
        let urls = await this._se3.uploadFiles({
          files: req.files as Express.Multer.File[],
          path: `user/${req?.user?._id}/posts/${post.folderId}`,
          storeType: Store_Enum.memory,
        });
        post.attachments?.push(...urls);
      }

      if (fcmTokens?.length) {
        await this._notificationService.sendNotifications({
          tokens: fcmTokens,
          data: {
            title: `You Are Mention On New Post`,
            body: content || "New Post",
          },
        });
      }

      if (content) post.content = content;
      if (allowComments) post.allowComments = allowComments;
      if (postPrivacy) post.postPrivacy = postPrivacy;

      await post.save();
      successResponse({ res, data: post });
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params as { postId: string };
      const currentUserId = req.user?._id as Types.ObjectId;
      const postObjectId = new Types.ObjectId(postId);

      const post = await this._postModel.findOneAndDelete({
        filter: { _id: postObjectId, createdBy: currentUserId },
      });

      if (!post) {
        throw new AppError("Post Not Found or Unauthorized", 404);
      }

      if (post.attachments?.length) {
        await this._se3.deleteFiles(post.attachments);
      }

      const mainComments = await this._commentModel.find({
        filter: { refId: postObjectId, onModel: ON_Model.Post },
        options: { select: "_id" },
      });
      const mainCommentIds = mainComments.map((c) => c._id as Types.ObjectId);

      let allCommentIdsToDelete: Types.ObjectId[] = [...mainCommentIds];

      if (mainCommentIds.length > 0) {
        const allReplyIds =
          await this._commentModel.getAllReplyIds(mainCommentIds);
        allCommentIdsToDelete.push(...allReplyIds);
      }

      if (allCommentIdsToDelete.length > 0) {
        const commentsWithAttachments = await this._commentModel.find({
          filter: { _id: { $in: allCommentIdsToDelete } },
          options: { select: "attachments" },
        });

        const commentFilesToDelete: string[] = [];
        commentsWithAttachments.forEach((c) => {
          if (c.attachments?.length) {
            commentFilesToDelete.push(...c.attachments);
          }
        });

        if (commentFilesToDelete.length) {
          await this._se3.deleteFiles(commentFilesToDelete);
        }

        await this._commentModel.deleteMany({
          _id: { $in: allCommentIdsToDelete },
        });

        await this._reactModel.deleteMany({
          ref: { $in: allCommentIdsToDelete },
          onModel: ON_Model.Comment,
        });
      }

      await this._reactModel.deleteMany({
        ref: postObjectId,
        onModel: ON_Model.Post,
      });

      successResponse({
        res,
        message:
          "Post and all its related comments, replies, reactions, and notifications cleared successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new PostService();
