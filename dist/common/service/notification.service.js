import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
class NotificatonService {
    client;
    constructor() {
        const serviceAccount = JSON.parse(readFileSync(resolve(process.cwd(), "src/config/social-media-app-22a43-firebase-adminsdk-fbsvc-952b37de0c.json")));
        this.client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
    async sendNotification({ token, data, }) {
        const message = {
            token,
            data,
        };
        return await this.client.messaging().send(message);
    }
    async sendNotifications({ tokens, data, }) {
        await Promise.all(tokens.map((token) => {
            return this.sendNotification({ token, data });
        }));
    }
}
export default new NotificatonService();
