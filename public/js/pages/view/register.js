const registerReq = async () => {
  const name = $("#username").val();
  const email = $("#email").val();
  const password = $("#password").val();

  try {
    const loginRes = await axios.post("/signup", { name, email, password });
    if (loginRes.status === 200) {
      // console.log("signup success");
      window.location.href="/home";
    }
  } catch (err) {
    console.error("registerReq: ", err);
    $("#login-failed-modal").modal("show");
    $("#login-err-msg").text(err.response.data.error);
  }
};

$(".login-btn").on("click", function (e) {
  e.preventDefault();
  registerReq();
  $("#username").val("");
  $("#email").val("");
  $("#password").val("");
});