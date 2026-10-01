import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	node_env: process.env.NODE_ENV,
	port: process.env.PORT,
	frontend_url: process.env.FRONTEND_URL,
	BASE_URL: process.env.BASE_URL,
	SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS,
	REDIS_USER: process.env.REDIS_USER,
	REDIS_PASS: process.env.REDIS_PASS,
	REDIS_HOST: process.env.REDIS_HOST,
	REDIS_PORT: process.env.REDIS_PORT,
};
