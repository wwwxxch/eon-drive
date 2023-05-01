import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import { sessionConfig } from "./server/util/session.js";
import { socketConn } from "./server/util/socket.js";
import { customError } from "./server/error/custom_error.js";

dotenv.config();
const port = process.env.PORT;

const app = express();
const server = http.createServer(app);

// ------------------------------------------------------------------------------
// session
const PROTOCOL =
	process.env.NODE_ENV === "dev"
		? process.env.LOCAL_PROTOCOL
		: process.env.PROD_PROTOCOL;

if (process.env.NODE_ENV === "prod") {
	app.set("trust proxy", 1);
}

if (PROTOCOL === "HTTPS") {
	sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// ------------------------------------------------------------------------------
// socket.io
const io = new Server(server);
io.engine.use(session(sessionConfig));
app.set("socketio", io);
socketConn(io);

// --------------------------------------------------------------------------------
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// --------------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("views", path.join(__dirname, "/server/view"));
app.set("view engine", "ejs");

// --------------------------------------------------------------------------------
// Page
import { page_member } from "./server/route/page//member/member_route.js";
import { page_visitor } from "./server/route/page/visitor/visitor_route.js";
app.use(page_member, page_visitor);

// --------------------------------------------------------------------------------
// API
import { user_auth_route } from "./server/route/user/user_auth_route.js";
import { user_usage_route } from "./server/route/user/user_usage_route.js";
import { file_upload_route } from "./server/route/ff/file_upload_route.js";
import { folder_create_route } from "./server/route/ff/folder_create_route.js";
import { file_list_route } from "./server/route/ff/file_list_route.js";
import { file_delete_route } from "./server/route/ff/file_delete_route.js";
import { file_download_route } from "./server/route/ff/file_download_route.js";
import { file_restore_route } from "./server/route/ff/file_restore_route.js";
import { link_manage_route } from "./server/route/link/link_manage_route.js";
import { link_list_route } from "./server/route/link/link_list_route.js";
import { view_route } from "./server/route/view/view_route.js";
import { notification_route } from "./server/route/notification/notification_route.js";

app.use(
	user_auth_route,
	user_usage_route,
	file_upload_route,
	folder_create_route,
	file_list_route,
	file_delete_route,
	file_download_route,
	file_restore_route,
	link_manage_route,
	link_list_route,
	view_route,
	notification_route
);

// ---------------------------------------------------
// Simple check
app.get("/check", (req, res) => {
	console.log("/check");
	return res.send("ok");
});

app.get("/test", (req, res) => {
	// console.log("req.protocol: ", req.protocol);
	// console.log("req.headers.host: ", req.headers.host);
	// console.log("req.hostname: ", req.hostname);
	// console.log("req.socket.remoteAddress: ", req.socket.remoteAddress);
	// console.log("req.headers[\"x-forwarded-for\"]: ", req.headers["x-forwarded-for"]);
	// console.log("req.headers[\"x-real-ip\"]: ", req.headers["x-real-ip"]);
	// console.log("req.ip: ", req.ip);
	// console.log("req.ips: ", req.ips);
	// console.log("req.path: ", req.path);
	// console.log("req.originalUrl: ", req.originalUrl);
	// console.log("req.url: ", req.url);
	res.send(`
  <p>req.protocol: ${req.protocol}</p>
  <p>req.headers.host: ${req.headers.host}</p>
  <p>req.hostname: ${req.hostname}</p>
  <p>req.socket.remoteAddress: ${req.socket.remoteAddress}</p>
  <p>req.headers["x-forwarded-for"]: ${req.headers["x-forwarded-for"]}</p>
  <p>req.headers["x-real-ip"]: ${req.headers["x-real-ip"]}</p>
  <p>req.ip: ${req.ip}</p>
  <p>req.ips: ${req.ips}</p>
  <p>req.path: ${req.path}</p>
  <p>req.originalUrl: ${req.originalUrl}</p>
  <p>req.url: ${req.url}</p>
`);
});

// ---------------------------------------------------
// Errors
app.use((req, res, next) => {
	console.log("ERROR req.path: ", req.path);
	res.status(404);
	res.render("error/error", {
		status: 404,
		message: "The page you requested is not existed.",
	});
});

app.use((err, req, res, next) => {
	if (err instanceof customError) {
		console.error("err.message: ", err.message);
		return res.status(err.status).json({ error: err.message });
	}
	// console.error("error handler: ", err);
	return res.status(err.status || 500).render("error/error", {
		status: err.status || 500,
		message: err.message || "Internal Server Error",
	});
});

// ---------------------------------------------------
server.listen(port, () => {
	console.log(`Server is running on port ${port}...`);
});
