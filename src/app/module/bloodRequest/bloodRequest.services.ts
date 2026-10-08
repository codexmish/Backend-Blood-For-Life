import {
	BloodGroupList,
	BloodrequestStatus,
	Urgency,
} from "../../../generated/prisma/enums";
import { BloodrequestWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
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

// ------get all request
const getAllRequestServices = async (query: IQuery, userId: string) => {
	// -----limit
	let limit = Number(query.limit) || 5;
	if (limit < 1) limit = 1;
	if (limit > 50) limit = 50;
	// -----page
	let page = Number(query.page) || 1;
	if (page < 1) page = 1;
	const skip = (page - 1) * limit;

	// -----sorting
	const sortableFields = ["createdAt", "needAt", "bagsNeeded"];
	const sortBy = sortableFields.includes(query.sortBy as string)
		? (query.sortBy as string)
		: "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

	// ------adding search logic
	const andCondition: BloodrequestWhereInput[] = [];

	// ----search address or hospitalName
	if (query.searchTerm) {
		andCondition.push({
			OR: [
				{ hospitalName: { contains: query.searchTerm, mode: "insensitive" } },
				{ address: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	// ---------blood group filter
	if (query.bloodGroup) {
		const bloodGroup = String(query.bloodGroup).toUpperCase();

		if (!Object.values(BloodGroupList).includes(bloodGroup as BloodGroupList)) {
			throw new AppError(httpStatus.BAD_REQUEST, "Invalid blood group");
		}

		andCondition.push({
			bloodGroup: bloodGroup as BloodGroupList,
		});
	}

	// ------urgency
	if (query.urgency) {
		const urgency = String(query.urgency).toUpperCase();
		if (!Object.values(Urgency).includes(urgency as Urgency)) {
			throw new AppError(httpStatus.BAD_REQUEST, "Invalid urgency");
		}
		andCondition.push({
			urgency: urgency as Urgency,
		});
	}

	// -----setting date time as 12:00 am
	const startOfTheDay = new Date();
	startOfTheDay.setHours(0, 0, 0, 0);

	// -----finding blood requests
	const bloodRequest = await prisma.bloodrequest.findMany({
		where: {
			AND: andCondition,
			needAt: {
				gte: startOfTheDay,
			},
			status: BloodrequestStatus.OPEN,
		},
		take: limit,
		skip: skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	//    ---------totla number
	const totalBloodRequest = await prisma.bloodrequest.count({
		where: {
			AND: andCondition,
			needAt: {
				gte: startOfTheDay,
			},
			status: BloodrequestStatus.OPEN,
		},
	});

	return {
		data: bloodRequest,
		meta: {
			page: page,
			limit: limit,
			total: totalBloodRequest,
			totalPages: Math.ceil(totalBloodRequest / limit),
		},
	};
};

export const bloodRequestServices = {
	createBloodRequest,
	getAllRequestServices,
};
