const socketConn = (io) => {
	io.use((socket, next) => {
		// const session = socket.request.session;
		const { user } = socket.request.session;
		if (user) {
			// console.log(user.id);
			next();
		} else {
			next(new Error("unauthorized"));
		}
	});

	io.on("connection", (socket) => {
		const { user } = socket.request.session;
		console.log(`User ${socket.id} connected`);
		socket.join("user_" + user.id);

		socket.on("disconnect", (reason) => {
			console.log(`User ${socket.id} disconnected due to ${reason}`);
			/*
        possible reasons:
        "io server disconnect"
        "io client disconnect"
        "ping timeout"
        "transport close"
        "transport error"
      */
			// TODO: pending - not sure how to reconnect
			if (reason === "ping timeout") {
				// socket.socket.reconnect();
			}
		});
	});
};

export { socketConn };
