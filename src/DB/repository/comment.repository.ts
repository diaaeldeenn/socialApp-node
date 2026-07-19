import type { CommentI } from "./../models/comment.model.js";
import type { Model } from "mongoose";
import BaseRepository from "./base.repository.js";
import commentModel from "../models/comment.model.js";
import { Types } from "mongoose";
import { ON_Model } from "../../common/enum/post.enum.js";

class CommentRepository extends BaseRepository<CommentI> {
  constructor(protected readonly model: Model<CommentI> = commentModel) {
    super(model);
  }
  public getAllReplyIds = async (
    commentIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> => {
    let allReplyIds: Types.ObjectId[] = [];
    let currentLevelIds = commentIds;

    while (currentLevelIds.length > 0) {
      const replies = await this.model.find(
        {
          refId: { $in: currentLevelIds },
          onModel: ON_Model.Comment,
        },
        "_id",
      );

      if (replies.length === 0) break;

      const replyIds = replies.map((r) => r._id as Types.ObjectId);
      allReplyIds.push(...replyIds);
      currentLevelIds = replyIds;
    }
    return allReplyIds;
  };
}

export default CommentRepository;
