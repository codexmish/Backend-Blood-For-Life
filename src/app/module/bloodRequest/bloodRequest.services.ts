import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appErro";
import { ICreateBloodRequest } from "./bloodRequest.interface";
import httpStatus from "http-status";

// -------create bloodRequest services
const createBloodRequest = async (
	paylod: ICreateBloodRequest,
	userId: string,
) => {
	// ------checking user exist or not
	const userEist = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!userEist) {
		throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
	}

	// --------create blood reuest
	const bloodRequest = await prisma.bloodrequest.create({
		data: {
			...paylod,
			requesterId: userId,
		},
	});

	return bloodRequest;
};

export const bloodRequestServices = { createBloodRequest };
