import type { Model } from "mongoose";
import BaseRepository from "./base.repository.js";
import type { FriendshipI } from "../models/friendship.model.js";
import friendShipModel from "../models/friendship.model.js";
import { Types } from "mongoose";

class FriendShipRepository extends BaseRepository<FriendshipI> {
  constructor(protected readonly model: Model<FriendshipI> = friendShipModel) {
    super(model);
  }

  async getUserFriendsIds(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const result = await this.model.aggregate<{ friendId: Types.ObjectId }>([
      { 
        $match: { 
          $or: [{ userA: userId }, { userB: userId }] 
        } 
      },
      {
        $project: {
          _id: 0,
          friendId: {
            $cond: {
              if: { $eq: ["$userA", userId] },
              then: "$userB",
              else: "$userA"
            }
          }
        }
      }
    ]);

    return result.map((item) => item.friendId);
  }
}

export default FriendShipRepository;