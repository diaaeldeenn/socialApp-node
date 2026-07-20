import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { decodeToken_FetchUser } from "../../common/middleware/auth.middleware.js";
import redisService from "../../common/service/redis.service.js";
import chatGateway from "../chat/realtime/chat.gateway.js";

class SocketGateWay {
  constructor() {}
  initIo = async (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    io.use(async (socket, next) => {
      try {
        const { user } = await decodeToken_FetchUser(
          socket.handshake.auth.authorization ||
            socket.handshake.headers.authorization,
        );
        socket.data.user = user;
        next();
      } catch (error: any) {
        next(error);
      }
    });

    io.on("connection", async (socket) => {
      redisService.addSocket({
        userId: socket.data.user._id,
        SocketId: socket.id,
      });

      await chatGateway.registerEvent(socket,io);

      socket.on("disconnect", async () => {
        await redisService.removeSocket({
          userId: socket.data.user._id,
          SocketId: socket.id,
        });
      });
    });
  };
}

export default new SocketGateWay();
