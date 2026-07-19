import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

class NotificatonService {
  private readonly client: admin.app.App;
  constructor() {
    const serviceAccount = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          "src/config/social-media-app-22a43-firebase-adminsdk-fbsvc-952b37de0c.json",
        ),
      ) as unknown as string,
    );

    this.client = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    const message = {
      token,
      data,
    };
    return await this.client.messaging().send(message);
  }

  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
    await Promise.all(
      tokens.map((token) => {
        return this.sendNotification({ token, data });
      }),
    );
  }
}

export default new NotificatonService();
