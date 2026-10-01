import { Router } from "express";
import { authControllers } from "./auth.controller";

const router = Router()

router.get("/signup", authControllers.signupController)


export const authRouter = router