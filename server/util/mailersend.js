import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

import dotenv from "dotenv";
dotenv.config();
const { NODE_ENV, LOCAL_HOST, PROD_HOST, MAILERSEND_API_KEY } = process.env;

let HOST;
if (NODE_ENV === "dev") HOST = LOCAL_HOST;
else if (NODE_ENV === "prod") HOST = PROD_HOST;

const mailerSend = new MailerSend({
	apiKey: MAILERSEND_API_KEY,
});

const sentFrom = new Sender("info@eondrive.net", "EonDrive");

const sendConfirmationMail = async (email, name, token) => {
	const recipient = [new Recipient(email, name)];

	const emailParams = new EmailParams()
		.setFrom(sentFrom)
		.setTo(recipient)
		.setSubject("Confirm your email for your EON Drive account").setHtml(`
      <p>Hi ${name},</p>
      <p><strong>Nice to meet you!</strong></p>
      <p>Thanks for using EON Drive! Please click the link below to confirm your email address.</p>
      <a href="${HOST}/verify-mail/${token}">Confirm your email</a>
      <p></p>
      <p>Thanks,</p>
      <p>EON Drive</p>
      <a href="${HOST}">${HOST}</a>
    `);
	try {
		const checkQuota = await mailerSend.others.getApiQuota();
		console.log("checkQuota.body.remaining: ", checkQuota.body.remaining);
		if (checkQuota.body.remaining < 1) {
			// throw new Error(
			// 	"sendConfrimationMail: checkQuota.body.remaining: ",
			// 	checkQuota.body.remaining
			// );
			return { status: 503 };
		}

		const send = await mailerSend.email.send(emailParams);
		// console.log("send: ", send);
		return { status: 200 };
	} catch (e) {
		console.error("sendConfirmationMail error: ", e);
		return { status: 500 };
	}
};

export { sendConfirmationMail };
