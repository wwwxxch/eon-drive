import dotenv from "dotenv";
import RedisStore from "connect-redis";
import { redis } from "./cache.js";

dotenv.config();

const redisStore = new RedisStore({
  client: redis,
  prefix: "user:"
});

const sessionConfig = {
	secret: process.env.SESSION_SECRET,
  store: redisStore,
	resave: false,
	saveUninitialized: false,
	cookie: { SameSite: "lax", maxAge: 200 * 60 * 1000 }, // 200 min
};

export { sessionConfig };
