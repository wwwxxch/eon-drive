import { API_VERSION } from "../../constant/constant.js";

const registerReq = async () => {
	$("#login-err-msg").empty();
	const name = $("#username").val();
	const email = $("#email").val();
	const password = $("#password").val();

	try {
		const loginRes = await axios.post(`/api/${API_VERSION}/signup`, {
			name,
			email,
			password,
		});
		if (loginRes.status === 200) {
			window.location.href = "/register/verify-mail-sent";
		}
	} catch (err) {
		// console.error("registerReq: ", err);
		$("#login-failed-modal").modal("show");
		if (typeof err.response.data.error === "string") {
			$("#login-err-msg").text(err.response.data.error);
		} else {
			err.response.data.error.forEach((item) => {
				$("#login-err-msg").append(`<div class="pb-1">${item}</div>`);
			});
		}
	}
};

$(".continue-btn").on("click", function (e) {
	e.preventDefault();
	if ($("#username").val() === "") {
		$("#login-err-msg").text("Please enter your name");
		$("#login-failed-modal").modal("show");
		return;
	}
	if ($("#email").val() === "") {
		$("#login-err-msg").text("Please enter your email");
		$("#login-failed-modal").modal("show");
		return;
	}
	const pattern =
		/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,16}$/;
	if ($("#password").val() === "") {
		$("#login-err-msg").text("Please enter your password");
		$("#login-failed-modal").modal("show");
		return;
	} else if (!pattern.test($("#password").val())) {
		$("#login-err-msg").text(
			"Password must contain 8-16 characters, at least one letter, one number and one one of below symbols (!@#$%^&*()_+) "
		);
		$("#login-failed-modal").modal("show");
		return;
	}
	if (!$("#agreeToTerms").is(":checked")) {
		$("#login-err-msg").text("Please agree to the terms and conditions");
		$("#login-failed-modal").modal("show");
		return;
	}

	registerReq();
	// $("#username").val("");
	// $("#email").val("");
	// $("#password").val("");
});
