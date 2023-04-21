const realTime = (io) => {
  io.use((socket, next) => {
    // const session = socket.request.session;
    const { user } = socket.request.session;
    if (user) {
      console.log(user.id);
      next();
    } else {
      next(new Error("unauthorized"));
    }
    
  });

  io.on("connection", (socket) => {  
    const { user } = socket.request.session;
    // console.log(`User ${socket.id} connected`);
    socket.join("user_" + user.id);

    socket.on("disconnect", () => {
      // console.log(`User ${socket.id} disconnected`);
    });

  });
};

export { realTime };