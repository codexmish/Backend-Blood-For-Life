import { IDonorQuery, IRegisterDonor, IUpdateDonor } from "./donor.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appErro";
import httpStatus from "http-status";
import {
	BloodGroupList,
	Role,
	UserStatus,
} from "../../../generated/prisma/enums";
import { DonorWhereInput } from "../../../generated/prisma/models";

// ------register donor services
const registerDonorServices = async (
	payload: IRegisterDonor,
	userId: string,
) => {
	// -----checking user exist or not
	const userExist = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		include: {
			donor: true,
		},
	});

	if (!userExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	// -----checking if already a donor
	if (userExist.role === Role.DONOR) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You are already registered as a donor",
		);
	}

	// -----only recipient can become donor (admin role must not be changed)
	if (userExist.role !== Role.RECIPIENT) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only recipient can register as a donor",
		);
	}

	// -----donor must have contact info
	if (!userExist.phone || !userExist.address) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Please add your phone number and address to your profile first",
		);
	}

	// -----creating donor profile and changing role together
	const donor = await prisma.$transaction(async (tx) => {
		// ------creating donor
		const donorCreate = await tx.donor.create({
			data: {
				...payload,
				userId: userExist.id,
			},
		});

		// ----updating user role
		await tx.user.update({
			where: {
				id: userExist.id,
			},
			data: {
				role: Role.DONOR,
			},
		});

		return donorCreate;
	});

	return donor;
};

// ------update donor profile services
const updateDonorProfileServices = async (
	payload: IUpdateDonor,
	userId: string,
) => {
	// -----checking donor profile exist or not
	const donorExist = await prisma.donor.findUnique({
		where: {
			userId,
		},
	});

	if (!donorExist) {
		throw new AppError(httpStatus.NOT_FOUND, "Donor profile not found");
	}

	// -----updating donor profile
	const updatedDonor = await prisma.donor.update({
		where: {
			userId,
		},
		data: payload,
	});

	return updatedDonor;
};

// ------get all donor
const getAllDonorServices = async (query: IDonorQuery) => {
	

    // -----limit
	let limit = Number(query.limit) || 5;
	if (limit < 1) limit = 1; 
	if (limit > 50) limit = 50; 
    // -----page
	let page = Number(query.page) || 1; 
	if (page < 1) page = 1;
	const skip = (page - 1) * limit;


    // -----sorting
    const sortableFields = ["createdAt", "lastDonationDate", "totalDonations"];
	const sortBy = sortableFields.includes(query.sortBy as string)
		? (query.sortBy as string)
		: "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

	// ------adding search logic
	const andCondition: DonorWhereInput[] = [];

	// ---------applying searching

	if (query.searchTerm) {
		andCondition.push({
			user: {
				OR: [
					{ address: { contains: query.searchTerm, mode: "insensitive" } },
					{ name: { contains: query.searchTerm, mode: "insensitive" } },
				],
			},
		});
	}

	// ---------blood group filter
	if (query.bloodGroup) {
		const bloodGroup = String(query.bloodGroup).toUpperCase();

		if (!Object.values(BloodGroupList).includes(bloodGroup as BloodGroupList)) {
			throw new AppError(httpStatus.BAD_REQUEST, "Invalid blood group");
		}

		andCondition.push({
			user: {
				bloodGroup: bloodGroup as BloodGroupList,
			},
		});
	}

	// ---------only available, eligible and active donors
	// -----last donation must be at least 4 months ago
	const eligibleDate = new Date();
	eligibleDate.setMonth(eligibleDate.getMonth() - 4);

	andCondition.push({
		isAvailable: true,
		OR: [
			{ lastDonationDate: null },
			{ lastDonationDate: { lte: eligibleDate } },
		],
		user: {
			role: Role.DONOR,
			status: UserStatus.ACTIVE,
			isDeleted: false,
			emailVerified: true,
		},
	});

	// ------finding  donors
	const donorList = await prisma.donor.findMany({
		where: {
			AND: andCondition
		},
		skip,
		take: limit,
		orderBy: { [sortBy]: sortOrder },
		select: {
			id: true,
			isAvailable: true,
			lastDonationDate: true,
			totalDonations: true,
			createdAt: true,
			user: {
				select: {
					id: true,
					name: true,
					bloodGroup: true,
					gender: true,
					address: true,
					avater: true,
				},
			},
		},
	});

	const totalCount = await prisma.donor.count({
		where: {
			AND: andCondition,
		},
	});

	return {
		data: donorList,
		meta: {
			page: page,
			limit: limit,
			total: totalCount,
			totalPages: Math.ceil(totalCount / limit),
		},
	};
};

// ------get single donor services
const getSingleDonorServices = async (donorId: string) => {
	const donor = await prisma.donor.findFirst({
		where: {
			id: donorId,
			user: {
				role: Role.DONOR,
				status: UserStatus.ACTIVE,
				isDeleted: false,
			},
		},
		select: {
			id: true,
			isAvailable: true,
			lastDonationDate: true,
			totalDonations: true,
			createdAt: true,
			user: {
				select: {
					id: true,
					name: true,
					bloodGroup: true,
					gender: true,
					address: true,
					avater: true,
				},
			},
		},
	});

	if (!donor) {
		throw new AppError(httpStatus.NOT_FOUND, "Donor not found");
	}

	return donor;
};

export const donorServices = {
	registerDonorServices,
	updateDonorProfileServices,
	getAllDonorServices,
	getSingleDonorServices,
};
