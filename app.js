import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import session from "express-session";

dotenv.config();
const port = process.env.PORT;

const app = express();
const server = http.createServer(app);

// socket.io setup
const io = new Server(server);
app.set("socketio", io);

// session configure
const sessionConfig = {
  // name: "member",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { SameSite: "lax", maxAge: 200 * 60 * 1000 } // 200 min
};

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
import { file_upload } from "./server/route/file_upload.js";
import { file_list } from "./server/route/file_list.js";
import { file_delete } from "./server/route/file_delete.js";
import { file_create } from "./server/route/file_create.js";
import { file_download } from "./server/route/file_download.js";
import { user } from "./server/route/user.js";

app.use(file_upload);
app.use(file_list);
app.use(file_delete);
app.use(file_create);
app.use(file_download);
app.use(user);

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
