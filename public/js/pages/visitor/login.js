import { API_VERSION, CONFIRM_MAIL_EXPIRE_HOUR } from "../../constants/constants.js";
import { resendVerifyMailByMail } from "../../api/resend_mail.js";

const loginReq = async () => {
	$("#login-err-msg").empty();
	const email = $("#email").val();
	const password = $("#password").val();

	try {
		const loginRes = await axios.post(`/api/${API_VERSION}/signin`, { email, password });
		if (loginRes.data.msg === "ok") {
			window.location.href = "/home";
		} else if (loginRes.data.msg === "non-verified") {
			const confirmedDT = new Date(loginRes.data.lastConfirmedTime);
			const currentDT = new Date(new Date().toUTCString());
			const diffTime = Math.ceil((currentDT - confirmedDT) / (60 * 1000));
			$("#login-div").hide();
			$("#not-verify-div").show();
			// console.log("diffTime: ", diffTime, " min");
			if (diffTime < CONFIRM_MAIL_EXPIRE_HOUR * 60) {
				$("#resend-verify-mail").text(
					`Verification mail can be sent after ${
						CONFIRM_MAIL_EXPIRE_HOUR * 60 - diffTime
					} min`
				);
				$("#resend-verify-mail").attr("disabled", true);
			} else {
				$("#resend-verify-mail").text("Resend verification mail");

				// resend verify mail button
				$("#resend-verify-mail").on("click", async function () {
					const resendVerifyMailRes = await resendVerifyMailByMail(email, password);
					// console.log(resendVerifyMailRes);

					if (resendVerifyMailRes.data.msg === "ok") {
						window.location.href = "/register/verify-mail-sent";
					} else if (
						resendVerifyMailRes.status !== 200 &&
						resendVerifyMailRes.status !== 500
					) {
						const errorHTML = `<span>${resendVerifyMailRes.data.error}</span>`;
						$("#verify-error-modal").modal("show");
						$("#verify-error-msg").html(errorHTML);
					} else {
						const errorHTML =
							"<span>Opps! Something went wrong. Please try later or contact us.</span>";
						$("#verify-error-modal").modal("show");
						$("#verify-error-msg").html(errorHTML);
					}
				});
			}
		}
	} catch (err) {
		// console.error("loginReq: ", err);
		$("#login-failed-modal").modal("show");
		if (typeof err.response.data.error === "string") {
			$("#login-err-msg").text(err.response.data.error);
		} else {
			err.response.data.error.forEach((item) => {
				$("#login-err-msg").append(`<div>${item}</div>`);
			});
		}
	}
};

$(".continue-btn").on("click", async function (e) {
	e.preventDefault();
	await loginReq();
});
