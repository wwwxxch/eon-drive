import { API_VERSION } from "../constants/constants.js";

const resendVerifyMailByToken = async (token) => {
	try {
		return await axios.get(
			`/api/${API_VERSION}/resend-verify-mail/${token}`
		);

	} catch (e) {
		console.error("resendVerifyMail: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

const resendVerifyMailByMail = async (email, password) => {
	try {
		return await axios.post(
			`/api/${API_VERSION}/resend-verify-mail/by-mail`,
			{
				email,
				password,
			}
		);

	} catch (e) {
		console.error("resendVerifyMail: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export { resendVerifyMailByToken, resendVerifyMailByMail };
