import chatService from "../chat/chat.service.js";
class ChatEvent {
    constructor() { }
    sayHi = async (socket) => {
        socket.on("sayHi", (data) => {
            chatService.sayHi(data);
        });
    };
    sendMessage = async (socket, io) => {
        socket.on("sendMessage", (data) => {
            chatService.sendMessage(data, socket, io);
        });
    };
}
export default new ChatEvent();
