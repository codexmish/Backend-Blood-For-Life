import { IRegisterDonor } from "./donor.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appErro";
import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";

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

export const donorServices = { registerDonorServices };
