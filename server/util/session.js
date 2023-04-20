import dotenv from "dotenv";
import RedisStore from "connect-redis";
import { redis } from "./cache.js";

dotenv.config();
const sessionHour = parseInt(process.env.SESSION_HOUR);

const redisStore = new RedisStore({
  client: redis,
  prefix: "user:"
});

let isProxy = false;
if (process.env.NODE_ENV === "prod") isProxy = true;

const sessionConfig = {
	secret: process.env.SESSION_SECRET,
  store: redisStore,
	resave: false,
	saveUninitialized: false,
	cookie: { SameSite: "true", maxAge: sessionHour * 60 * 60 * 1000 },
  proxy: isProxy
};

export { sessionConfig };
