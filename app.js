import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

dotenv.config();
const port = process.env.PORT;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set("socketio", io);

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

app.use(file_upload);
app.use(file_list);
app.use(file_delete);
app.use(file_create);
app.use(file_download);

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
