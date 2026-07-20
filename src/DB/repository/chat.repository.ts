import type { Model } from "mongoose";
import BaseRepository from "./base.repository.js";
import type { ChatI } from "../models/chat.model.js";
import ChatModel from "../models/chat.model.js";

class ChatRepository extends BaseRepository<ChatI> {
  constructor(protected readonly model: Model<ChatI> = ChatModel) {
    super(model);
  }
}

export default ChatRepository;
