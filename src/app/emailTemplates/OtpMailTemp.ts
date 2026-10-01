export const OTPMailTemp = (otp: string, expiryMinutes: number = 5) => {
	const year = new Date().getFullYear();

	return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verification Email</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #fef2f2; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fef2f2" style="padding: 40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #fecaca;">

            <!-- Header -->
            <tr>
              <td align="center" bgcolor="#b91c1c" style="padding: 34px 28px; background-color: #b91c1c;">
                <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: bold; letter-spacing: 0.5px;">
                  🩸 Blood for Life
                </h1>
                <p style="margin: 10px 0 0; font-size: 14px; color: #fecaca;">
                  Connecting blood donors with those in need
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td align="center" style="padding: 36px 28px 28px; text-align: center;">
                <h2 style="margin: 0 0 12px; font-size: 22px; color: #111827;">
                  Verify Your Email
                </h2>
                <p style="margin: 0 0 26px; font-size: 15px; line-height: 1.7; color: #4b5563;">
                  Hello,<br />
                  Use the 6-digit code below to verify your email address and continue with Blood for Life.
                </p>

                <div style="display: inline-block; padding: 16px 32px; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #b91c1c; background-color: #fee2e2; border: 2px dashed #f87171; border-radius: 14px;">
                  ${otp}
                </div>

                <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.7; color: #6b7280;">
                  This code is valid for <strong>${expiryMinutes} minutes</strong>.<br />
                  Please do not share it with anyone.
                </p>

                <p style="margin: 22px 0 0; font-size: 13px; line-height: 1.7; color: #9ca3af;">
                  If you did not request this email, you can safely ignore it.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" bgcolor="#fef2f2" style="padding: 20px; background-color: #fef2f2; border-top: 1px solid #fecaca;">
                <p style="margin: 0; font-size: 12px; color: #991b1b;">
                  © ${year} Blood for Life. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
