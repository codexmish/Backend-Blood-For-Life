import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userServices } from "./user.services";
import { RequestUser } from "../../middleWares/authCheck";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

// ------profile update constroller
const profileUpdate = catchAsync(async (req: Request, res: Response) => {
	const result = await userServices.updateProfile(
		req.body,
		req.user as RequestUser,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Profile Updated Successfully",
		data: result,
	});
});

// -------avater upload controller
const avaterupload = catchAsync(async (req: Request, res: Response) => {
	const result = await userServices.avaterUpload(
		req.file?.buffer as Buffer,
		req.user?.userId as string,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Avater Updated Successfully",
		data: result,
	});
});

export const userControllers = { profileUpdate, avaterupload };
