import Redis from "ioredis";

import dotenv from "dotenv";
dotenv.config();
const { 
  CACHE_HOST,
  CACHE_PORT,
  CACHE_USER,
  CACHE_PASSWORD 
} = process.env;

const redis = new Redis({
  host: CACHE_HOST,
  port: CACHE_PORT,
  username: CACHE_USER,
  password: CACHE_PASSWORD,
  retryStrategy(times) {
    console.log(`***Retrying redis connection: attempt ${times}***`);
    console.log(`***redis.status: ${redis.status}***`);
    if (times < 4) {
      return 1000 * 1;
    }
    else if (times > 10) {
      return null; 
    }
    return 1000 * 5;
  }
});

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

export { redis };
