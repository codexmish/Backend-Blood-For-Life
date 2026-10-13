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

export const donationControllers = {
	donateToRequestController,
	leaveRequestController,
	getMyCommitmentsController,
	getMyDonationsController,
};
