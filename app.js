import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import session, { MemoryStore } from "express-session";
import { sessionConfig } from "./server/util/session.js";
// import RedisStore from "connect-redis";
// import { redis } from "./server/util/cache.js";
import { socketConn } from "./server/util/socket.js";

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
	// sessionConfig.cookie.secure = true; // this is for HTTPS !!!
}
// const sessionHour = parseInt(process.env.SESSION_HOUR);
// let isProxy = false;
// if (process.env.NODE_ENV === "prod") isProxy = true;
// const sessionConfig = {
//   secret: process.env.SESSION_SECRET,
//   store: new MemoryStore(),
//   resave: false,
//   saveUninitialized: false,
//   cookie: { SameSite: "true", maxAge: sessionHour * 60 * 60 * 1000 },
//   proxy: isProxy,
// };
// const sessionStoreChange = (req, res, next) => {
//   if (!redis || redis.status !== "ready") {
//     console.log("sessionStoreChange - MemoryStore");
//     sessionConfig.store = new MemoryStore();
//     console.log(sessionConfig);
//   } else {
//     console.log("sessionStoreChange - redis");
//     sessionConfig.store = new RedisStore({ client: redis, prefix: "user:" });
//     console.log(sessionConfig);
//   }
//   next();
// };

// app.use(sessionStoreChange);
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

app.set("view engine", "ejs");

// --------------------------------------------------------------------------------
// Page
import { page } from "./server/route/page/page.js";
app.use(page);

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

// ---------------------------------------------------
// Errors
app.use((req, res, next) => {
	console.log("ERROR req.path: ", req.path);
	const err = new Error("The page you requested is not existed.");
	err.status = 404;
	next(err);
});

app.use((err, req, res, next) => {
	res.status(err.status || 500).render("error/error", {
		status: (err.status || 500),
		message: (err.message || "Internal Server Error") ,
		stack: err.stack,
	});
});

// ---------------------------------------------------
server.listen(port, () => {
	console.log(`Server is running on port ${port}...`);
});
