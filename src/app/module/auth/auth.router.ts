import { Router } from "express";
import { authControllers } from "./auth.controller";
import { zodValidation } from "../../middleWares/zodValidation";
import { userSignupSchema } from "./auth.validation";

const router = Router()

router.post("/signup", zodValidation(userSignupSchema), authControllers.signupController)


export const authRouter = router