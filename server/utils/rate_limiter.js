import { redis } from "./cache.js";

const rateLimiter = (times) => {
	return async (req, res, next) => {
		console.log("rateLimiter: ip: ", req.headers["x-forwarded-for"]);
		const ip = req.headers["x-forwarded-for"];

		if (!redis || redis.status !== "ready") {
			return next();
		} else {
			const count = await redis.incr(`IP${ip}`);
			console.log("rateLimiter: count: ", count);
			if (count === 1) {
				// 60 seconds
				await redis.expire(`IP${ip}`, 60);
				// const ttlStatus = await redis.ttl(`IP${ip}`);
				// console.log("ttlStatus: ", ttlStatus);
			}
			if (count > times) {
				return res.status(429).json({ error: "Too many request" });
			}
			return next();
		}
	};
};

export { rateLimiter };
