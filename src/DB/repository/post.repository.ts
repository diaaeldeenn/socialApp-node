import type { Model } from "mongoose";
import type { PostI } from "../models/post.model.js";
import BaseRepository from "./base.repository.js";
import postModel from "../models/post.model.js";
import { Types } from "mongoose";
import { PostPrivacy } from "../../common/enum/post.enum.js";
import type { Request } from "express";

export const getPrivacyFilter = (req: Request, friendsIds: Types.ObjectId[] = []) => {
  const userId = req.user?._id;
  const allowedCreators = userId ? [...friendsIds, userId] : friendsIds;

  return {
    $or: [
      { postPrivacy: PostPrivacy.public },
      ...(userId
        ? [
            {
              postPrivacy: PostPrivacy.private,
              createdBy: { $in: allowedCreators },
            },
          ]
        : []),
      ...(userId
        ? [
            {
              tags: { $in: [userId] },
            },
          ]
        : []),
    ],
  };
};


class PostRepository extends BaseRepository<PostI> {
  constructor(protected readonly model: Model<PostI> = postModel) {
    super(model);
  }
}

export default PostRepository;