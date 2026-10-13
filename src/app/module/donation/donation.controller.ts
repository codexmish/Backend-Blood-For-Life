import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { donationServices } from "./donation.services";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

// -------donate to blood request controller
const donateToRequestController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await donationServices.donateToRequestServices(
			req.params.requestId as string,
			req.user?.userId as string,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "You joined this blood request Successfully",
			data: result,
		});
	},
);

// -------leave blood request controller
const leaveRequestController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await donationServices.leaveRequestServices(
			req.params.requestId as string,
			req.user?.userId as string,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "You left this blood request Successfully",
			data: result,
		});
	},
);

// -------get my commitments controller
const getMyCommitmentsController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await donationServices.getMyCommitmentsServices(
			req.query,
			req.user?.userId as string,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "My commitments get Successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

// -------get my donations controller
const getMyDonationsController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await donationServices.getMyDonationsServices(
			req.query,
			req.user?.userId as string,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "My donations get Successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

// -------get public donations controller
const getPublicDonationsController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await donationServices.getPublicDonationsServices(req.query);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Donations get Successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

// -------get all donations controller (admin)
const getAllDonationsController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await donationServices.getAllDonationsServices(req.query);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "All donations get Successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

export const donationControllers = {
	donateToRequestController,
	leaveRequestController,
	getMyCommitmentsController,
	getMyDonationsController,
	getPublicDonationsController,
	getAllDonationsController,
};
