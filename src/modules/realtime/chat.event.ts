import type { Server, Socket } from "socket.io";
import chatService from "../chat/chat.service.js";

class ChatEvent {
  constructor() {}

  sayHi = async (socket: Socket) => {
    socket.on("sayHi", (data) => {
      chatService.sayHi(data);
    });
  };

  sendMessage = async (socket: Socket,io:Server) => {
    socket.on("sendMessage", (data) => {
      chatService.sendMessage(data,socket,io);
    });
  };
}

export default new ChatEvent();
