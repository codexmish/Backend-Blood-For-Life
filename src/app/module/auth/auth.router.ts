import { Router } from "express";
import { authControllers } from "./auth.controller";
import { zodValidation } from "../../middleWares/zodValidation";
import { otpVerifySchema, userSignupSchema } from "./auth.validation";

const router = Router();

// -----signup router
router.post(
	"/signup",
	zodValidation(userSignupSchema),
	authControllers.signupController,
);

// -------otp verify and create user router
router.post(
	"/otp-verify",
	zodValidation(otpVerifySchema),
	authControllers.otpVerifyController,
);

export const authRouter = router;
