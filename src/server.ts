import app from "./app";
import envConfig from "./app/envConfig";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
const port = envConfig.port;

const main = async () => {
	try {
		// -----connecting db
		await prisma.$connect();
		console.log("Connected to the database successfully.");

		await redisClient.connect()
		console.log("redis connected");
		

		app.listen(port, () => {
			console.log(`server running on port ${port}`);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
