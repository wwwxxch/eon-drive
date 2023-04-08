const checkAuth = () => {
  axios.get("/login-status")
		.then((data) => {
			// console.log(data);
			// console.log(data.data.msg);
			window.location.href = "/home.html";
		})
		.catch((err) => {
			// console.error(err);
			console.error(err.response.data.error);
		});
};

export { checkAuth };