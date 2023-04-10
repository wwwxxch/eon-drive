import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import session from "express-session";
import { sessionConfig } from "./server/util/session.js";

dotenv.config();
const port = process.env.PORT;

const app = express();
const server = http.createServer(app);

// socket.io setup
const io = new Server(server);
app.set("socketio", io);

// session
if (process.env.NODE_ENV === "prod") {
  app.set("trust proxy", 1);
  sessionConfig.cookie.secure = true;
}
app.use(session(sessionConfig));

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ---------------------------------------------------
// Routes
import { user_auth_route } from "./server/route/user/user_auth_route.js";
import { file_upload_route } from "./server/route/file/file_upload_route.js";
import { file_list_route } from "./server/route/file/file_list_route.js";
import { file_delete_route } from "./server/route/file/file_delete_route.js";
import { file_download_route } from "./server/route/file/file_download_route.js";
import { share_link_route } from "./server/route/share/share_link_route.js";

// app.use(user_auth_route);
// app.use(file_upload_route);
app.use(user_auth_route, file_upload_route);
app.use(file_list_route);
app.use(file_delete_route);
app.use(file_download_route);
app.use(share_link_route);

// ---------------------------------------------------
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from  "path";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// console.log("__filename: ", __filename);
// console.log("__dirname: ", __dirname);

// ---------------------------------------------------
// Simple check

app.get("/check", (req, res) => {
  console.log("/check");
  return res.send("Hello World!");
});

// ---------------------------------------------------
// Errors

app.use((req, res, next) => {
  console.log("ERROR req.path: ", req.path);
  const err = new Error("=====Page not found=====");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {  
  res.status(err.status || 500)
    .json({ 
      status: err.status,
      message: err.message,
      stack: err.stack 
    });
});

// ---------------------------------------------------
server.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});
