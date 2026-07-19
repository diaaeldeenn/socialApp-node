import BaseRepository from "./base.repository.js";
import postModel from "../models/post.model.js";
import { Types } from "mongoose";
import { PostPrivacy } from "../../common/enum/post.enum.js";
export const getPrivacyFilter = (req, friendsIds = []) => {
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
class PostRepository extends BaseRepository {
    model;
    constructor(model = postModel) {
        super(model);
        this.model = model;
    }
}
export default PostRepository;
