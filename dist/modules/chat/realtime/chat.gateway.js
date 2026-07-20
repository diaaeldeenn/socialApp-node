import chatEvent from "../../realtime/chat.event.js";
class ChatGateWay {
    constructor() { }
    registerEvent = async (socket, io) => {
        chatEvent.sayHi(socket);
        chatEvent.sendMessage(socket, io);
    };
}
export default new ChatGateWay();
