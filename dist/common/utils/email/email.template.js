export const email_Template = (otp) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Verify Your Email</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">

        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; margin:40px 0; border-radius:10px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(90deg, #FF4B91, #FF85B3); padding:20px; text-align:center; color:#ffffff; font-size:24px; font-weight:bold;">
              Sarahah App
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; text-align:center;">

              <h2 style="margin:0; color:#333;">Verify Your Email</h2>

              <p style="color:#555; margin:20px 0;">
                Use the OTP below to complete your registration.
              </p>

              <!-- OTP BOX -->
              <div style="font-size:32px; letter-spacing:8px; font-weight:bold; color:#FF85B3; margin:20px 0;">
                ${otp}
              </div>

              <p style="color:#888; font-size:14px;">
                This OTP is valid for 2 minutes.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f4; padding:15px; text-align:center; font-size:12px; color:#999;">
              © 2026 Sarahah App. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};
