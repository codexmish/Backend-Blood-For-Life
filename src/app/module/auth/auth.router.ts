import { Router } from "express";
import { authControllers } from "./auth.controller";
import { zodValidation } from "../../middleWares/zodValidation";
import {
	forgetPasswordSchema,
	otpVerifySchema,
	resetPasswordSchema,
	userSignInSchema,
	userSignupSchema,
} from "./auth.validation";
import { authCheck } from "../../middleWares/authCheck";

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

// ------sign in router
router.post(
	"/signin",
	zodValidation(userSignInSchema),
	authControllers.signInController,
);

// -------forgetPassword router
router.post(
	"/forget-password",
	zodValidation(forgetPasswordSchema),
	authControllers.forgetPasswordController,
);

// -------reset pass router
router.post(
	"/reser-password",
	zodValidation(resetPasswordSchema),
	authControllers.resetPasswordController,
);

// ------get user profile controller
router.get("/me", authCheck(), authControllers.userProfileController);

export const authRouter = router;
