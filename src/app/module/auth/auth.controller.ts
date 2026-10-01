import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { authServices } from "./auth.services";

// --------sign up user controller
const signupController = catchAsync(async (req: Request, res: Response) => {
	const result = await authServices.signupServices(req.body);
});

export const authControllers = { signupController };
