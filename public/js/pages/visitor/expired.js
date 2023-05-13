import { resendVerifyMailByToken } from "../../api/resend_mail.js";

$("#resend-verify-mail").on("click", async function () {
	const windowPathName = window.location.pathname;
	const confirmToken = windowPathName.split("/")[2];
	// console.log(windowPathName);
	// console.log(confirmToken);
	const resendVerifyMailRes = await resendVerifyMailByToken(confirmToken);
	console.log(resendVerifyMailRes);

	if (resendVerifyMailRes.data.msg === "ok") {
		window.location.href = "/register/verify-mail-sent";
	} else if (resendVerifyMailRes.data.msg === "not expired") {
		const errorHTML = "<span>Verification link can be resent after 1 hour.</span>";
		$("#link-not-expired-modal").modal("show");
		$("#link-not-expired-msg").html(errorHTML);
	} else if (resendVerifyMailRes.status !== 200) {
		const errorHTML =
			"<span>Opps! Something went wrong. Please try later or contact us.</span>";
		$("#link-not-expired-modal").modal("show");
		$("#link-not-expired-msg").html(errorHTML);
	}
});
