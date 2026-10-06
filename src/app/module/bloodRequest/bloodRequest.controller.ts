import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";

// -------create bloodRequest controller
const createBloodRequest = catchAsync(
	async (req: Request, res: Response) => {},
);

export const bloodRequestControllers = { createBloodRequest };
