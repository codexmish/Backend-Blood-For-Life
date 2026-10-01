import nodemailer from "nodemailer";
import envConfig from "../envConfig";

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
	service: "gmail",
	port: 587,
	secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
	auth: {
		user: envConfig.SMTP_USER,
		pass: envConfig.SMTP_PASS,
	},
});

export interface MailPayload<T> {
	email: string;
	subject: string;
	mailTemp: T;
}

export const mailSender = async ({
	email,
	subject,
	mailTemp,
}: MailPayload<string>) => {
	try {
		await transporter.sendMail({
			from: "Blood For Life <team@bfl.com>", // sender address
			to: email, // list of recipients
			subject: subject, // subject line
			html: mailTemp, // HTML body
		});
	} catch (error) {
		console.log("error while sending mail", error);
	}
};
