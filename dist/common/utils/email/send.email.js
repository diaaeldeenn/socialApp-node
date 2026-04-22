import nodemailer from "nodemailer";
export const sendEmail = async (mailOptions) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });
    const info = await transporter.sendMail({
        from: `"SocialApp Ceo" <${process.env.GMAIL_USER}>`,
        ...mailOptions
    });
    console.log("Message sent: %s", info.messageId);
    return info.accepted.length > 0 ? true : false;
};
export const generateOtp = async () => {
    return Math.floor(Math.random() * 900000 + 100000);
};
