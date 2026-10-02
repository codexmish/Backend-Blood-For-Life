export const WelcomeMailTemp = (
	userName: string,
	dashboardUrl: string = "#",
) => {
	const year = new Date().getFullYear();

	return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Blood for Life</title>
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
                  We are thrilled to have you with us!
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td align="center" style="padding: 36px 28px 28px; text-align: center;">
                <h2 style="margin: 0 0 12px; font-size: 22px; color: #111827;">
                  Welcome, ${userName}! 🎉
                </h2>
                <p style="margin: 0 0 26px; font-size: 15px; line-height: 1.7; color: #4b5563;">
                  Thank you for joining Blood for Life. Your account is now active, and you can start connecting with blood donors and people in need. Every donation can save a life, and you are now part of that mission.
                </p>

                <!-- Call To Action Button -->
                <a href="${dashboardUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; background-color: #dc2626; border-radius: 12px;">
                  Go to Dashboard
                </a>

                <p style="margin: 28px 0 0; font-size: 14px; line-height: 1.7; color: #6b7280;">
                  If you have any questions or need help getting started, feel free to reach out to our support team.
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
