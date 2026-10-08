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

// -----get all request with filter
const getAllRequestController = catchAsync(
	async (req: Request, res: Response) => {
		const requestList = await bloodRequestServices.getAllRequestServices(
			req.query
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Blood request get Successfully",
			data: requestList.data,
			meta: requestList.meta,
		});
	},
);




// -----get single request
const getSingleRequestController = catchAsync(async(req: Request, res: Response)=>{
	const bloodRequest = await bloodRequestServices.getSigleRequestService(req.params.id as string)

	sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Blood request get Successfully",
			data: bloodRequest
		});


})


// -----get all request with filter
const getAllMyRequestController = catchAsync(
	async (req: Request, res: Response) => {
		const requestList = await bloodRequestServices.getAllMyRequestServices(
			req.query, req.user?.userId as string
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Blood request get Successfully",
			data: requestList.data,
			meta: requestList.meta,
		});
	},
);

export const bloodRequestControllers = {
	createBloodRequest,
	getAllRequestController,
	getSingleRequestController,
	getAllMyRequestController

};
