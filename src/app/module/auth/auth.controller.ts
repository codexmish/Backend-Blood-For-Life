import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { authServices } from "./auth.services";
import httpStatus from "http-status";
import envConfig from "../../envConfig";
import { RequestUser } from "../../middleWares/authCheck";

// --------sign up user controller
const signupController = catchAsync(async (req: Request, res: Response) => {
	const result = await authServices.signupServices(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Check your email",
	});
});

// -------otp verify and create user controller
const otpVerifyController = catchAsync(async (req: Request, res: Response) => {
	const result = await authServices.otpVerifyServices(req.body);

	const { accessToken, refreshToken, createdUser } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: envConfig.node_env === "production",
		sameSite: envConfig.node_env === "production" ? "none" : "lax",
		path: "/",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: envConfig.node_env === "production",
		sameSite: envConfig.node_env === "production" ? "none" : "lax",
		path: "/",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Otp verified and user registered Successfuly",
		data: createdUser,
	});
});

// ------signin controller
const signInController = catchAsync(async (req: Request, res: Response) => {
	const result = await authServices.signInServices(req.body);

	const { accessToken, refreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: envConfig.node_env === "production",
		sameSite: envConfig.node_env === "production" ? "none" : "lax",
		path: "/",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: envConfig.node_env === "production",
		sameSite: envConfig.node_env === "production" ? "none" : "lax",
		path: "/",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User login successfull",
	});
});

// -------forget password controller
const forgetPasswordController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await authServices.forgetPasswordServices(req.body);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "OTP sent",
		});
	},
);

// ------password reset controller
const resetPasswordController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await authServices.resetPasswordServices(req.body);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "password updated",
			data: result,
		});
	},
);

// ----get user profile controller
const userProfileController = catchAsync(
	async (req: Request, res: Response) => {
		const user = await authServices.userProfileServices(
			req.user as RequestUser,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "User data get successfully",
			data: user,
		});
	},
);

export const authControllers = {
	signupController,
	otpVerifyController,
	signInController,
	forgetPasswordController,
	resetPasswordController,
	userProfileController,
};
