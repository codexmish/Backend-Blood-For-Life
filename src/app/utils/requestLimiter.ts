import rateLimit from "express-rate-limit";

// ----------set api req limit
export const limiter = (
	time: number,
	limit: number,
	successSkip: boolean = true,
) => {
	return rateLimit({
		windowMs: time, // Time in milisecound
		limit: limit, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
		message: { error: "Too many requests, please try again later." },
		skipSuccessfulRequests: successSkip,
	});
};
