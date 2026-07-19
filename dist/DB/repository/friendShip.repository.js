import BaseRepository from "./base.repository.js";
import friendShipModel from "../models/friendship.model.js";
import { Types } from "mongoose";
class FriendShipRepository extends BaseRepository {
    model;
    constructor(model = friendShipModel) {
        super(model);
        this.model = model;
    }
    async getUserFriendsIds(userId) {
        const result = await this.model.aggregate([
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
