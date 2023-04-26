const registerReq = async () => {
  $("#login-err-msg").empty();
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

$(".login-btn").on("click", function (e) {
  e.preventDefault();
  registerReq();
  $("#username").val("");
  $("#email").val("");
  $("#password").val("");
});