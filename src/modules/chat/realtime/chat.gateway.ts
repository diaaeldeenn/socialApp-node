import type { Server, Socket } from "socket.io";
import chatEvent from "../../realtime/chat.event.js";

class ChatGateWay {
  constructor() {}

  registerEvent = async (socket: Socket, io: Server) => {
    chatEvent.sayHi(socket);
    chatEvent.sendMessage(socket,io);
  };
}

export default new ChatGateWay();
