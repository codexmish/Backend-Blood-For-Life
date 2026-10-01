import { isValidateEmail, isValidatePassword } from "../../utils/helpers";
import { ISignup, ISignupErrors } from "./auth.interface";
import { BloodGroupList } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appErro";
import httpStatus from "http-status";

// ---------signup services
const signupServices = async (payload: ISignup) => {
	const { name, email, bloodGroup, password } = payload;

	// ----get a empty obj for all validation errors togather
	const errors: ISignupErrors = {};

	// ---name validatine
	if (!name) {
		errors.name = "Name is required";
	}

	// ---email validatine
	if (!email) {
		errors.email = "Email is required";
	} else if (!isValidateEmail(email)) {
		errors.email = "Email not valid";
	}

	// ---password validatine
	if (!password) {
		errors.password = "Password is required";
	} else if (!isValidatePassword(password)) {
		errors.password = "Password not valid";
	}

	// ---blood group validation
	if (!bloodGroup) {
		errors.bloodGroup = "Blood Group is required";
	} else if (!Object.values(BloodGroupList).includes(bloodGroup)) {
		errors.bloodGroup = "Invalid blood group";
	}

	// --------sending errors
	if (Object.keys(errors).length > 0) {
		return { errors: errors };
	}

	// -----checking if user already exist with same email
	const userExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (userExist) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User already exist with this email",
		);
	}
};

export const authServices = { signupServices };
