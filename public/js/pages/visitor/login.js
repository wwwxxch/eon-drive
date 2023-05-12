import { API_VERSION } from "../../constant/constant";

const loginReq = async () => {
	$("#login-err-msg").empty();
	const email = $("#email").val();
	const password = $("#password").val();

	try {
		const loginRes = await axios.post(`/api/${API_VERSION}/signin`, { email, password });
		if (loginRes.status === 200) {
			// console.log("login success");
			window.location.href = "/home";
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

$(".continue-btn").on("click", function (e) {
	e.preventDefault();
	loginReq();
	// $("#email").val("");
	// $("#password").val("");
});
