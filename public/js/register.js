const loginStatus = axios({
  method: "GET",
  url: "/login-status"
}).then((data) => {
  console.log(data);
  console.log(data.data.msg);
  window.location.href="/home.html";
}).catch((err) => {
  console.error(err);
  console.error(err.response.data.error);
});

const registerReq = async () => {
  const name = $(".input-name").val();
  const email = $(".input-email").val();
  const password = $(".input-password").val();

  try {
    const loginRes = await axios.post("/signup", { name: name, email: email, password: password });
    if (loginRes.status === 200) {
      console.log("signup success");
      window.location.href="/home.html";
    }
  } catch (err) {
    console.error("registerReq: ", err);
    console.log(err.response.data);
  }
};

$(".input-button").on("click", function (e) {
  e.preventDefault();
  registerReq();
  $(".input-email").val("");
  $(".input-password").val("");
});