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

// ----update donor profile controller
const updateDonorProfile = catchAsync(async (req: Request, res: Response) => {
	const result = await donorServices.updateDonorProfileServices(
		req.body,
		req.user?.userId as string,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Donor profile updated successfully",
		data: result,
	});
});

// ------get all donor
const getAllDonor = catchAsync(async (req: Request, res: Response) => {
	const donorList = await donorServices.getAllDonorServices(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Donor profile updated successfully",
		data: donorList.data,
		meta: donorList.meta,
	});
});

// ------get single donor
const getSingleDonor = catchAsync(async (req: Request, res: Response) => {
	const result = await donorServices.getSingleDonorServices(
		req.params.id as string,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Donor retrieved successfully",
		data: result,
	});
});

export const donorController = {
	registerDonor,
	updateDonorProfile,
	getAllDonor,
	getSingleDonor,
};
