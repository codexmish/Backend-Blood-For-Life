import app from "./app";
import envConfig from "./app/envConfig";
import { prisma } from "./app/lib/prisma";
const port = envConfig.port;

const main = async () => {
	try {
		// -----connecting db
		await prisma.$connect();
		console.log("Connected to the database successfully.");

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
