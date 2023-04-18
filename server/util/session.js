import dotenv from "dotenv";
import RedisStore from "connect-redis";
import { redis } from "./cache.js";

dotenv.config();

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
	cookie: { SameSite: "lax", maxAge: 5 * 60 * 60 * 1000 }, // 5 hours
  proxy: isProxy
};

export { sessionConfig };
