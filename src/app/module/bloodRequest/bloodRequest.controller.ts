import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { bloodRequestServices } from "./bloodRequest.services";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

// -------create bloodRequest controller
const createBloodRequest = catchAsync(async (req: Request, res: Response) => {
	const bloodRequest = await bloodRequestServices.createBloodRequest(
		req.body,
		req.user?.userId as string,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Blood request created Successfully",
		data: bloodRequest,
	});
});

export const bloodRequestControllers = { createBloodRequest };
