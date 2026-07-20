import BaseRepository from "./base.repository.js";
import ChatModel from "../models/chat.model.js";
class ChatRepository extends BaseRepository {
    model;
    constructor(model = ChatModel) {
        super(model);
        this.model = model;
    }
}
export default ChatRepository;
