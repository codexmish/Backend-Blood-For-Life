import { createClient } from "redis";
import envConfig from "../envConfig";

export const redisClient = createClient({
	username: envConfig.REDIS_USER,
	password: envConfig.REDIS_PASS,
	socket: {
		host: envConfig.REDIS_HOST,
		port: Number(envConfig.REDIS_PORT),
	},
});

// client.on('error', err => console.log('Redis Client Error', err));

// await client.set('foo', 'bar');
// const result = await client.get('foo');
// console.log(result)  // >>> bar
