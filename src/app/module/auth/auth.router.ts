import { Router } from "express";
import { authControllers } from "./auth.controller";
import { zodValidation } from "../../middleWares/zodValidation";
import {
	changePasswordSchema,
	forgetPasswordSchema,
	otpVerifySchema,
	resendOtpSchema,
	resetPasswordSchema,
	userSignInSchema,
	userSignupSchema,
} from "./auth.validation";
import { authCheck } from "../../middleWares/authCheck";
import { limiter } from "../../utils/requestLimiter";

const router = Router();

// -----signup router
router.post(
	"/signup",
	limiter(10 * 60 * 1000, 5, false),
	zodValidation(userSignupSchema),
	authControllers.signupController,
);

// -------otp verify and create user router
router.post(
	"/otp-verify",
	limiter(10 * 60 * 1000, 5),
	zodValidation(otpVerifySchema),
	authControllers.otpVerifyController,
);

// ------sign in router
router.post(
	"/signin",
	limiter(10 * 60 * 1000, 5),
	zodValidation(userSignInSchema),
	authControllers.signInController,
);

// -------forgetPassword router
router.post(
	"/forget-password",
	limiter(10 * 60 * 1000, 5, false),
	zodValidation(forgetPasswordSchema),
	authControllers.forgetPasswordController,
);

// -------reset pass router
router.post(
	"/reset-password",
	limiter(10 * 60 * 1000, 5),
	zodValidation(resetPasswordSchema),
	authControllers.resetPasswordController,
);

// ------get user profile controller
router.get("/me", authCheck(), authControllers.userProfileController);

// ----access token generate with refresh token
router.post(
	"/refresh-token",
	limiter(10 * 60 * 1000, 5),
	authControllers.refreshTokenController,
);

// ----logout router
router.post("/logout", authControllers.logoutController);

// -----resend otp router
router.post(
	"/resend-otp",
	limiter(10 * 60 * 1000, 5, false),
	zodValidation(resendOtpSchema),
	authControllers.resendOtpController,
);

// -----change password router
router.patch(
	"/change-password",
	limiter(10 * 60 * 1000, 5),
	authCheck(),
	zodValidation(changePasswordSchema),
	authControllers.changePasswordController,
);

export const authRouter = router;
