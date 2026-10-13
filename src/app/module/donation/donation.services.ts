import { BloodrequestStatus } from "../../../generated/prisma/enums";
import { BloodrequestWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appErro";
import httpStatus from "http-status";

// -------donate to blood request services
const donateToRequestServices = async (requestId: string, userId: string) => {
	const result = await prisma.$transaction(async (tx) => {
		// ------checking donor exist or not
		const donor = await tx.donor.findUnique({
			where: {
				userId,
			},
			include: {
				user: true,
			},
		});

		if (!donor) {
			throw new AppError(httpStatus.NOT_FOUND, "Donor profile not found");
		}

		// ------checking blood request exist or not
		const bloodRequest = await tx.bloodrequest.findUnique({
			where: {
				id: requestId,
			},
			include: {
				donors: {
					select: {
						id: true,
					},
				},
			},
		});

		if (!bloodRequest) {
			throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
		}

		// ------request must be open
		if (bloodRequest.status !== BloodrequestStatus.OPEN) {
			throw new AppError(httpStatus.BAD_REQUEST, "This request is not open");
		}

		// -----setting date time as 12:00 am
		const startOfTheDay = new Date();
		startOfTheDay.setHours(0, 0, 0, 0);

		if (bloodRequest.needAt < startOfTheDay) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"This request date is already over",
			);
		}

		// ------can't donate to own request
		if (bloodRequest.requesterId === userId) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"You can't donate to your own request",
			);
		}

		// ------blood group must be same
		if (donor.user.bloodGroup !== bloodRequest.bloodGroup) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Your blood group doesn't match with this request",
			);
		}

		// ------donor must be available
		if (!donor.isAvailable) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"You are not available now. Please turn on your availability first",
			);
		}

		// ------last donation must be at least 4 months ago
		if (donor.lastDonationDate) {
			const nextDonationDate = new Date(donor.lastDonationDate);
			nextDonationDate.setMonth(nextDonationDate.getMonth() + 4);

			if (nextDonationDate > new Date()) {
				throw new AppError(
					httpStatus.BAD_REQUEST,
					`You can donate again after ${nextDonationDate.toDateString()}`,
				);
			}
		}

		// ------checking if already joined
		const alreadyJoined = bloodRequest.donors.some(
			(item) => item.id === donor.id,
		);

		if (alreadyJoined) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"You already joined this request",
			);
		}

		// ------no more donor than bags needed
		if (bloodRequest.donors.length >= bloodRequest.bagsNeeded) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"This request already has enough donors",
			);
		}

		// --------adding donor to the request
		const updatedRequest = await tx.bloodrequest.update({
			where: {
				id: bloodRequest.id,
			},
			data: {
				donors: {
					connect: {
						id: donor.id,
					},
				},
			},
			include: {
				_count: {
					select: {
						donors: true,
					},
				},
			},
		});

		return updatedRequest;
	});

	return result;
};

// -------leave blood request services
const leaveRequestServices = async (requestId: string, userId: string) => {
	const result = await prisma.$transaction(async (tx) => {
		// ------checking donor exist or not
		const donor = await tx.donor.findUnique({
			where: {
				userId,
			},
		});

		if (!donor) {
			throw new AppError(httpStatus.NOT_FOUND, "Donor profile not found");
		}

		// ------checking blood request exist or not
		const bloodRequest = await tx.bloodrequest.findUnique({
			where: {
				id: requestId,
			},
			include: {
				donors: {
					select: {
						id: true,
					},
				},
			},
		});

		if (!bloodRequest) {
			throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
		}

		// ------donor must be joined first
		const joined = bloodRequest.donors.some((item) => item.id === donor.id);

		if (!joined) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"You are not joined in this request",
			);
		}

		// ------only open request can be left
		if (bloodRequest.status !== BloodrequestStatus.OPEN) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"You can't leave a closed request",
			);
		}

		// --------removing donor from the request
		const updatedRequest = await tx.bloodrequest.update({
			where: {
				id: bloodRequest.id,
			},
			data: {
				donors: {
					disconnect: {
						id: donor.id,
					},
				},
			},
			include: {
				_count: {
					select: {
						donors: true,
					},
				},
			},
		});

		return updatedRequest;
	});

	return result;
};

// -------get my commitments services (open requests i joined)
const getMyCommitmentsServices = async (query: IQuery, userId: string) => {
	// -----limit
	let limit = Number(query.limit) || 5;
	if (limit < 1) limit = 1;
	if (limit > 50) limit = 50;
	// -----page
	let page = Number(query.page) || 1;
	if (page < 1) page = 1;
	const skip = (page - 1) * limit;

	// ------checking donor exist or not
	const donor = await prisma.donor.findUnique({
		where: {
			userId,
		},
	});

	if (!donor) {
		throw new AppError(httpStatus.NOT_FOUND, "Donor profile not found");
	}

	// -----open requests where i am a donor
	const whereCondition: BloodrequestWhereInput = {
		status: BloodrequestStatus.OPEN,
		donors: {
			some: {
				id: donor.id,
			},
		},
	};

	// -----finding requests (nearest date first)
	const commitments = await prisma.bloodrequest.findMany({
		where: whereCondition,
		take: limit,
		skip: skip,
		orderBy: {
			needAt: "asc",
		},
		include: {
			_count: {
				select: {
					donors: true,
				},
			},
		},
	});

	//    ---------total number
	const total = await prisma.bloodrequest.count({
		where: whereCondition,
	});

	return {
		data: commitments,
		meta: {
			page: page,
			limit: limit,
			total: total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const donationServices = {
	donateToRequestServices,
	leaveRequestServices,
	getMyCommitmentsServices,
};
