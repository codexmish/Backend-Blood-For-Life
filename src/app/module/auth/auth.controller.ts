import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { authServices } from "./auth.services";
import httpStatus from "http-status";
import envConfig from "../../envConfig";

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
		data: result,
	});
});



const resetPasswordController = catchAsync(async(req: Request, res: Response)=>{
	const result = await authServices.resetPasswordServices(req.body)

	sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "password updated",
    data: result,
  });
})

export const authControllers = {
	signupController,
	otpVerifyController,
	signInController,
	resetPasswordController
};
