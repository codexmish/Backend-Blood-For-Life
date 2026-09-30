import express, { Application, Request, Response } from "express";
import cors from "cors";
import envConfig from "./app/envConfig";
import cookieParser from "cookie-parser";

const app: Application = express();

app.use(express.json());
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

export default app;
