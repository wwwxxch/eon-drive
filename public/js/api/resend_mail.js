import { API_VERSION } from "../constant/constant.js";

const resendVerifyMailByToken = async (token) => {
	try {
		const resendVerifyMailServerRes = await axios.get(
			`/api/${API_VERSION}/resend-verify-mail/${token}`
		);
		return resendVerifyMailServerRes;
	} catch (e) {
		console.error("resendVerifyMail: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

const resendVerifyMailByMail = async (email, password) => {
	try {
		const resendVerifyMailServerRes = await axios.post(
			`/api/${API_VERSION}/resend-verify-mail/by-mail`,
			{
				email,
				password,
			}
		);
		return resendVerifyMailServerRes;
	} catch (e) {
		console.error("resendVerifyMail: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export { resendVerifyMailByToken, resendVerifyMailByMail };
