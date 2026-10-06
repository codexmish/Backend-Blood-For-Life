import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { donorServices } from "./donor.services";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

// -------register donor controller
const registerDonor = catchAsync(async (req: Request, res: Response) => {
	const result = await donorServices.registerDonorServices(
		req.body,
		req.user?.userId as string,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Register as a donor successfull",
		data: result,
	});
});

export const donorController = { registerDonor };
