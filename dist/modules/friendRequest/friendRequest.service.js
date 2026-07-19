import { Types } from "mongoose";
import UserRepository from "../../DB/repository/user.repository.js";
import FriendRequestRepository from "../../DB/repository/friendRequest.repository.js";
import { successResponse } from "../../common/utils/global/response.success.js";
import { AppError } from "../../common/utils/global/response.error.js";
import RedisService from "../../common/service/redis.service.js";
import NotificationService from "../../common/service/notification.service.js";
import FriendShipRepository from "../../DB/repository/friendShip.repository.js";
import { friendRequestStatus } from "../../common/enum/friend.enum.js";
class FriendRequestService {
    _userModel = new UserRepository();
    _friendRequestModel = new FriendRequestRepository();
    _friendShipModel = new FriendShipRepository();
    _redisService = RedisService;
    _notificationService = NotificationService;
    constructor() { }
    sendRequest = async (req, res, next) => {
        try {
            const { to } = req.body;
            const fromUserId = req.user?._id;
            const toUserId = new Types.ObjectId(to);
            const toUser = await this._userModel.findById(to);
            if (!toUser) {
                throw new AppError("To User Not Found", 404);
            }
            if (fromUserId.toString() === toUserId.toString()) {
                throw new AppError("You cannot send a friend request to yourself", 400);
            }
            const exists = await this._friendRequestModel.findOne({
                filter: {
                    $or: [
                        { from: fromUserId, to: toUserId },
                        { from: toUserId, to: fromUserId },
                    ],
                },
            });
            if (exists) {
                throw new AppError("Friend request already exists", 400);
            }
            const isAlreadyFriend = await this._friendShipModel.findOne({
                filter: {
                    $or: [
                        { userA: fromUserId, userB: toUserId },
                        { userA: toUserId, userB: fromUserId },
                    ],
                },
            });
            if (isAlreadyFriend) {
                throw new AppError("You are already friends", 400);
            }
            const friendRequest = await this._friendRequestModel.create({
                from: fromUserId,
                to: toUserId,
            });
            if (!friendRequest) {
                throw new AppError("Failed to send friend request", 500);
            }
            const fcmTokens = await this._redisService.getFCMs({
                userId: toUser._id,
            });
            if (fcmTokens?.length) {
                await this._notificationService.sendNotifications({
                    tokens: fcmTokens,
                    data: {
                        title: "New Friend Request",
                        body: `${req.user?.userName || "Someone"} sent you a friend request`,
                    },
                });
            }
            successResponse({
                res,
                message: "Friend request sent successfully",
                data: friendRequest,
            });
        }
        catch (error) {
            console.error(error);
            next(error);
        }
    };
    processRequest = async (req, res, next) => {
        try {
            const { requestId } = req.params;
            const { status } = req.body;
            const currentUserId = req.user?._id;
            const requestObjectId = new Types.ObjectId(requestId);
            const request = await this._friendRequestModel.findById(requestObjectId);
            if (!request) {
                throw new AppError("Request not found", 404);
            }
            if (request.to.toString() !== currentUserId.toString()) {
                throw new AppError("Unauthorized to process this request", 403);
            }
            if (!Object.values(friendRequestStatus).includes(status)) {
                throw new AppError("Invalid status value", 400);
            }
            let friendship = null;
            if (status === friendRequestStatus.accepted) {
                friendship = await this._friendShipModel.create({
                    userA: currentUserId,
                    userB: request.from,
                });
                const fcmTokens = await this._redisService.getFCMs({
                    userId: request.from,
                });
                if (fcmTokens?.length) {
                    await this._notificationService.sendNotifications({
                        tokens: fcmTokens,
                        data: {
                            title: "Friend Request Accepted",
                            body: `${req.user?.userName || "Someone"} accepted your friend request!`,
                        },
                    });
                }
            }
            await this._friendRequestModel.findOneAndDelete({
                filter: { _id: requestObjectId },
            });
            successResponse({
                res,
                message: `Friend request ${status} successfully`,
                data: friendship ?? { requestId, status },
            });
        }
        catch (error) {
            console.error(error);
            next(error);
        }
    };
    getReceivedRequests = async (req, res, next) => {
        try {
            const currentUserId = req.user?._id;
            const requests = await this._friendRequestModel.find({
                filter: {
                    to: currentUserId,
                    status: friendRequestStatus.pending,
                },
                options: {
                    populate: { path: "from", select: "userName profileDoc email" },
                },
            });
            successResponse({
                res,
                message: "Received friend requests fetched successfully",
                data: requests,
            });
        }
        catch (error) {
            console.error(error);
            next(error);
        }
    };
    getSendRequests = async (req, res, next) => {
        try {
            const currentUserId = req.user?._id;
            const requests = await this._friendRequestModel.find({
                filter: {
                    from: currentUserId,
                    status: friendRequestStatus.pending,
                },
                options: {
                    populate: { path: "to", select: "userName profileDoc email" },
                },
            });
            successResponse({
                res,
                message: "Sent friend requests fetched successfully",
                data: requests,
            });
        }
        catch (error) {
            console.error(error);
            next(error);
        }
    };
    removeFriend = async (req, res, next) => {
        try {
            const { target } = req.params;
            const currentUserId = req.user?._id;
            const targetUserId = new Types.ObjectId(target);
            const friendship = await this._friendShipModel.findOne({
                filter: {
                    $or: [
                        { userA: currentUserId, userB: targetUserId },
                        { userA: targetUserId, userB: currentUserId },
                    ],
                },
            });
            if (!friendship) {
                throw new AppError("You are not friends", 400);
            }
            await this._friendShipModel.findOneAndDelete({
                filter: { _id: friendship._id },
            });
            successResponse({
                res,
                message: "Friend removed successfully",
                data: { targetUserId },
            });
        }
        catch (error) {
            console.error(error);
            next(error);
        }
    };
    cancelRequest = async (req, res, next) => {
        try {
            const { requestId } = req.params;
            const currentUserId = req.user?._id;
            const requestObjectId = new Types.ObjectId(requestId);
            const request = await this._friendRequestModel.findOneAndDelete({
                filter: {
                    _id: requestObjectId,
                    from: currentUserId,
                },
            });
            if (!request) {
                throw new AppError("Request not found or you are not authorized to cancel it", 404);
            }
            successResponse({
                res,
                message: "Friend request canceled successfully",
                data: { requestId },
            });
        }
        catch (error) {
            console.error(error);
            next(error);
        }
    };
}
export default new FriendRequestService();
