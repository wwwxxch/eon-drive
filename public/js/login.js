const loginReq = async () => {
  const email = $("#email").val();
  const password = $("#password").val();

  try {
    const loginRes = await axios.post("/signin", { email: email, password: password });
    if (loginRes.status === 200) {
      // console.log("login success");
      window.location.href="/home";
    }
  } catch (err) {
    // console.error("loginReq: ", err);
    $("#login-failed-modal").modal("show");
    $("#login-err-msg").text(err.response.data.error);
  }
};

$(".login-btn").on("click", function (e) {
  e.preventDefault();
  loginReq();
  $("#email").val("");
  $("#password").val("");
});