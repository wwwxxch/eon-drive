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
if (process.env.PROTOCOL === "HTTPS") {
  app.set("trust proxy", 1);
  sessionConfig.cookie.secure = true;
}
app.use(session(sessionConfig));

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.set("view engine", "ejs");

// --------------------------------------------------------------------------------
// Page
import { page } from "./server/route/page/page.js";
app.use(page);

// --------------------------------------------------------------------------------
// API
import { user_auth_route } from "./server/route/user/user_auth_route.js";
import { file_upload_route } from "./server/route/ff/file_upload_route.js";
import { folder_create_route } from "./server/route/ff/folder_create_route.js";
import { file_list_route } from "./server/route/ff/file_list_route.js";
import { file_delete_route } from "./server/route/ff/file_delete_route.js";
import { file_download_route } from "./server/route/ff/file_download_route.js";
import { file_restore_route } from "./server/route/ff/file_restore_route.js";
import { link_manage_route } from "./server/route/link/link_manage_route.js";
import { view_route } from "./server/route/view/view_route.js";

app.use(
  user_auth_route, 
  file_upload_route,
  folder_create_route,
  file_list_route,
  file_delete_route,
  file_download_route,
  file_restore_route,
  link_manage_route,
  view_route
);

// ---------------------------------------------------
// Simple check
app.get("/check", (req, res) => {
  console.log("/check");
  return res.send("/check");
});

app.get("/123", (req, res) => {
  console.log(123);
  return res.send("/123");
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
