import type { Types } from "mongoose";
import { createClient, type RedisClientType } from "redis";

export class RedisService {
  private readonly client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.Redis_URL!,
    });
  }
  async connect() {
    try {
      await this.client.connect();
      console.log("Success To Connect Redis");
    } catch (error) {
      console.log("Error To Connect With Redis");
    }
  }
  setValue = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string;
    ttl: number;
  }) => {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      return ttl
        ? await this.client.set(key, data, { EX: ttl })
        : await this.client.set(key, data);
    } catch (error) {
      console.log("error to set data in redis", error);
    }
  };

  updateValue = async ({ key, value }: { key: string; value: string }) => {
    try {
      if (!(await this.client.exists(key))) {
        return 0;
      }
      const data = typeof value === "string" ? value : JSON.stringify(value);
      return await this.client.set(key, data);
    } catch (error) {
      console.log("error to update data in redis", error);
    }
  };

  getValue = async (key: string) => {
    try {
      try {
        return JSON.parse((await this.client.get(key)) as string);
      } catch (error) {
        return await this.client.get(key);
      }
    } catch (error) {
      console.log("error to get data in redis", error);
    }
  };

  existsValue = async (key: string) => {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.log("error to check data exists in redis", error);
    }
  };

  ttl_redis = async (key: string) => {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.log("error to get ttl from redis", error);
    }
  };

  deleteKey = async (key: string | string[]) => {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.log("error to delete data in redis", error);
    }
  };

  keys = async (pattern: string) => {
    try {
      return await this.client.keys(`${pattern}*`);
    } catch (error) {
      console.log("error to get keys from redis", error);
    }
  };

  incr = async (key: string) => {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.log("error to incr operation", error);
    }
  };


  // ============================================================================

  
  fcmKey(userId: Types.ObjectId) {
    return `user:FCM:${userId}`;
  }
  async addFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sAdd(this.fcmKey(userId), FCMToken);
  }
  async removeFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sRem(this.fcmKey(userId), FCMToken);
  }
  async getFCMs({ userId }: { userId: Types.ObjectId }) {
    return await this.client.sMembers(this.fcmKey(userId));
  }
  async hasFCM({ userId }: { userId: Types.ObjectId }) {
    return await this.client.sCard(this.fcmKey(userId));
  }
  async removeFCMUser({ userId }: { userId: Types.ObjectId }) {
    return await this.client.del(this.fcmKey(userId));
  }


  // ==============================================================================

  socketKey(userId: Types.ObjectId) {
    return `user:Socket:${userId}`;
  }
  async addSocket({
    userId,
    SocketId,
  }: {
    userId: Types.ObjectId;
    SocketId: string;
  }) {
    return await this.client.sAdd(this.socketKey(userId), SocketId);
  }
  async removeSocket({
    userId,
    SocketId,
  }: {
    userId: Types.ObjectId;
    SocketId: string;
  }) {
    return await this.client.sRem(this.socketKey(userId), SocketId);
  }
  async getSockets({ userId }: { userId: Types.ObjectId }) {
    return await this.client.sMembers(this.socketKey(userId));
  }
  async hasSockets({ userId }: { userId: Types.ObjectId }) {
    return await this.client.sCard(this.socketKey(userId));
  }
  async removeSocketUser({ userId }: { userId: Types.ObjectId }) {
    return await this.client.del(this.socketKey(userId));
  }
}

export default new RedisService();
