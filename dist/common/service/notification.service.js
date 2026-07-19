import admin from "firebase-admin";
class NotificationService {
    client;
    constructor() {
        this.client =
            admin.apps.length > 0
                ? admin.app()
                : admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.PROJECT_ID,
                        clientEmail: process.env.CLIENT_EMAIL,
                        privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
                    }),
                });
    }
    async sendNotification({ token, data, }) {
        return this.client.messaging().send({
            token,
            data,
        });
    }
    async sendNotifications({ tokens, data, }) {
        await Promise.all(tokens.map((token) => this.sendNotification({ token, data })));
    }
}
export default new NotificationService();
