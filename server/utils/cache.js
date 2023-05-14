import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
const { CACHE_HOST, CACHE_PORT, CACHE_USER, CACHE_PASSWORD, CACHE_DB, NODE_ENV } = process.env;

console.log("NODE_ENV: ", NODE_ENV);

let redisConfig = {
	host: CACHE_HOST,
	port: parseInt(CACHE_PORT),
	username: CACHE_USER,
	password: CACHE_PASSWORD,
	db: parseInt(CACHE_DB),
	retryStrategy(times) {
		console.log(`***Retrying redis connection: attempt ${times}***`);
		console.log(`***redis.status: ${redis.status}***`);
		if (times < 4) return 1000 * 2 ** 0;
		else if (times > 10) return 1000 * 2 ** times;
		return 1000 * 5;
	},
};
if (NODE_ENV === "prod") {
	redisConfig.tls = {};
}

const redis = new Redis(redisConfig);

redis.on("connect", () => {
	console.log("===Success! Redis connection established===");
});

redis.on("error", (err) => {
	if (err.code === "ECONNREFUSED") {
		console.warn(`===Could not connect to Redis: ${err.message}===`);
	} else if (err.name === "MaxRetriesPerRequestError") {
		console.error(`===Critical Redis error: ${err.message}. Shutting down===`);
		process.exit(1);
	} else {
		console.error(`===Redis encountered an error: ${err.message}===`);
	}
});

const pub = redis.duplicate();
const sub = redis.duplicate();

pub.on("connect", () => {
	console.log("pub connect");
});
sub.on("connect", () => {
	console.log("sub connect");
});

pub.on("error", (err) => {
	console.error(`pub connect error: ${err}`);
});
sub.on("error", (err) => {
	console.error(`sub connect error: ${err}`);
});

export { redis, pub, sub };
