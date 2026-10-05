import express, { Application, Request, Response } from "express";
import cors from "cors";
import envConfig from "./app/envConfig";
import cookieParser from "cookie-parser";
import { notFoundRoute } from "./app/middleWares/notFoundRoute";
import { globalErrorHandaler } from "./app/middleWares/globalErrorHandaler";
import { authRouter } from "./app/module/auth/auth.router";
import { userRouter } from "./app/module/user/user.router";

const app: Application = express();

app.use(express.json());

if (envConfig.node_env === "production") {
	app.set("trust proxy", 1);
}

app.use(
	cors({
		origin: envConfig.frontend_url,
		credentials: true,
	}),
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ========Test route======
app.get("/", async (req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		message: "Welcome to Blood for life",
	});
});

// =======router
app.use(`${envConfig.BASE_URL}/auth`, authRouter);
app.use(`${envConfig.BASE_URL}/user`, userRouter);

app.use(notFoundRoute);
app.use(globalErrorHandaler);

export default app;
