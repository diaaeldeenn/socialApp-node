import admin from "firebase-admin";

class NotificationService {
  private readonly client: admin.app.App;

  constructor() {
    this.client =
      admin.apps.length > 0
        ? admin.app()
        : admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.PROJECT_ID!,
              clientEmail: process.env.CLIENT_EMAIL!,
              privateKey: process.env.PRIVATE_KEY!.replace(/\\n/g, "\n"),
              
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
    return this.client.messaging().send({
      token,
      data,
    });
  }

  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
    await Promise.all(
      tokens.map((token) => this.sendNotification({ token, data }))
    );
  }
}

export default new NotificationService();