export const email_Template = (otp) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Email Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">

        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; margin:40px 0; border-radius:10px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(90deg, #4A90E2, #6FC3FF); padding:20px; text-align:center; color:#ffffff; font-size:24px; font-weight:bold;">
              Social Media App
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; text-align:center;">

              <h2 style="margin:0; color:#333;">Verify Your Email</h2>

              <p style="color:#555; margin:20px 0;">
                Welcome! To continue setting up your account, please use the verification code below.
              </p>

              <!-- OTP BOX -->
              <div style="font-size:32px; letter-spacing:8px; font-weight:bold; color:#4A90E2; margin:20px 0;">
                ${otp}
              </div>

              <p style="color:#888; font-size:14px;">
                This code will expire in 2 minutes. Do not share it with anyone.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f4; padding:15px; text-align:center; font-size:12px; color:#999;">
              © 2026 Social Media App. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};
