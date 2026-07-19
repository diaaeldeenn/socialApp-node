import admin from "firebase-admin";

class NotificationService {
  private readonly client: admin.app.App;

  constructor() {
    this.client =
      admin.apps.length > 0
        ? admin.app()
        : admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID!,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
              privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(
                /\\n/g,
                "\n",
              ),
            }),
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
      tokens.map((token) => this.sendNotification({ token, data })),
    );
  }
}

export default new NotificationService();