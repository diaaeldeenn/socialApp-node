import { createClient } from "redis";
export class RedisService {
    client;
    constructor() {
        this.client = createClient({
            url: process.env.Redis_URL,
        });
    }
    async connect() {
        try {
            await this.client.connect();
            console.log("Success To Connect Redis");
        }
        catch (error) {
            console.log("Error To Connect With Redis");
        }
    }
    setValue = async ({ key, value, ttl, }) => {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            return ttl
                ? await this.client.set(key, data, { EX: ttl })
                : await this.client.set(key, data);
        }
        catch (error) {
            console.log("error to set data in redis", error);
        }
    };
    updateValue = async ({ key, value }) => {
        try {
            if (!(await this.client.exists(key))) {
                return 0;
            }
            const data = typeof value === "string" ? value : JSON.stringify(value);
            return await this.client.set(key, data);
        }
        catch (error) {
            console.log("error to update data in redis", error);
        }
    };
    getValue = async (key) => {
        try {
            try {
                return JSON.parse((await this.client.get(key)));
            }
            catch (error) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            console.log("error to get data in redis", error);
        }
    };
    existsValue = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.log("error to check data exists in redis", error);
        }
    };
    ttl_redis = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.log("error to get ttl from redis", error);
        }
    };
    deleteKey = async (key) => {
        try {
            return await this.client.del(key);
        }
        catch (error) {
            console.log("error to delete data in redis", error);
        }
    };
    keys = async (pattern) => {
        try {
            return await this.client.keys(`${pattern}*`);
        }
        catch (error) {
            console.log("error to get keys from redis", error);
        }
    };
    incr = async (key) => {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.log("error to incr operation", error);
        }
    };
    fcmKey(userId) {
        return `user:FCM:${userId}`;
    }
    async addFCM({ userId, FCMToken }) {
        return await this.client.sAdd(this.fcmKey(userId), FCMToken);
    }
    async removeFCM({ userId, FCMToken }) {
        return await this.client.sRem(this.fcmKey(userId), FCMToken);
    }
    async getFCMs({ userId }) {
        return await this.client.sMembers(this.fcmKey(userId));
    }
    async hasFCM({ userId }) {
        return await this.client.sCard(this.fcmKey(userId));
    }
    async removeFCMUser({ userId }) {
        return await this.client.del(this.fcmKey(userId));
    }
}
export default new RedisService();
