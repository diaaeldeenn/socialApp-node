import type { Request, Response } from "express";
import ChatRepository from "../../DB/repository/chat.repository.js";
import { AppError } from "../../common/utils/global/response.error.js";
import { successResponse } from "../../common/utils/global/response.success.js";
import UserRepository from "../../DB/repository/user.repository.js";
import type { Server, Socket } from "socket.io";
import redisService from "../../common/service/redis.service.js";

class ChatService {
  constructor() {}
  private readonly _chatModel = new ChatRepository();
  private readonly _userModel = new UserRepository();

  getChat = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const chat = await this._chatModel.findOne({
      filter: {
        participants: {
          $all: [req.user?._id, userId],
        },
        group: { $exists: false },
      },
      projection: {
        message: {
          $slice: -5,
        },
      },
      options: {
        populate: [
          {
            path: "participants",
          },
        ],
      },
    });
    if (!chat) {
      throw new AppError("Chat Not Found", 400);
    }
    successResponse({ res, message: "Done", data: chat });
  };


  sayHi = async (data: any) => {
    console.log(data);
  };

  sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { sendTo, content } = data;
    const createdBy = socket.data.user._id;
    const user = await this._userModel.findById(sendTo);
    if (!user) {
      throw new AppError("User Not Found");
    }

    const chat = await this._chatModel.findOneAndUpdate({
      filter: {
        participants: {
          $all: [sendTo, createdBy],
        },
        group: { $exists: false },
      },
      update: {
        $push: {
          message: {
            content,
            createdBy,
          },
        },
      },
    });

    if (!chat) {
      await this._chatModel.create({
        createdBy,
        message: [{ createdBy, content }],
        participants: [sendTo, createdBy],
      });
    }

    io.to(await redisService.getSockets(createdBy)).emit("successMessage", {
      content,
    });
    io.to(await redisService.getSockets(sendTo)).emit("newMessage", {
      content,
      from: socket.data.user,
    });
  };
}

export default new ChatService();
