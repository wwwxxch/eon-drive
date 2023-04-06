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

const loginReq = async () => {
  const email = $(".input-email").val();
  const password = $(".input-password").val();

  try {
    const loginRes = await axios.post("/signin", { email: email, password: password });
    if (loginRes.status === 200) {
      console.log("login success");
      window.location.href="/home.html";
    }
  } catch (err) {
    console.error("loginReq: ", err);
    console.log(err.response.data);
  }
};

$(".input-button").on("click", function (e) {
  e.preventDefault();
  loginReq();
  $(".input-email").val("");
  $(".input-password").val("");
});