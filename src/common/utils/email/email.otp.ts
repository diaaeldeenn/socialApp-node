import RedisService from "../../service/redis.service.js";
import { AppError } from "../global/response.error.js";
import { Hash } from "../security/hash.security.js";
import { email_Template } from "./email.template.js";
import { generateOtp, sendEmail } from "./send.email.js";

export const sendEmailOtp = async (email: string) => {
  const isBlocked = await RedisService.ttl_redis(`block_otp::${email}`);
  if (isBlocked! > 0) {
    throw new AppError(`Please Try Again After ${isBlocked} Second`);
  }
  const ttl = await RedisService.ttl_redis(`otp::${email}`);
  if (!ttl) {
    throw new AppError("Can't Fint TTL");
  }
  if (ttl > 0) {
    throw new AppError(`You Can Resend Otp After ${ttl} Second`);
  }
  const maxOtp = await RedisService.getValue(`max_otp::${email}`);
  if (maxOtp >= 3) {
    await RedisService.setValue({
      key: `block_otp::${email}`,
      value: "1",
      ttl: 60 * 5,
    });
    throw new AppError("You Have Exceeded The Max Number Of Tries");
  }
  const otp = await generateOtp();
  await sendEmail({
    to: email,
    subject: "Welcome To SarahahApp",
    html: email_Template(otp),
  });
  await RedisService.setValue({
    key: `otp::${email}`,
    value: Hash({ plainText: `${otp}` }),
    ttl: 60 * 2,
  });
  await RedisService.incr(`max_otp::${email}`);
};
