import { IOtpVerify, ISignup } from "./auth.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appErro";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import envConfig from "../../envConfig";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import { mailSender } from "../../utils/mailService";
import { OTPMailTemp } from "../../emailTemplates/OtpMailTemp";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";
import { WelcomeMailTemp } from "../../emailTemplates/welcomeMailTemp";

// ---------signup services
const signupServices = async (payload: ISignup) => {
	const { name, email, bloodGroup, password } = payload;

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

	// -----password hash
	const hashedPassword = await bcrypt.hash(
		password,
		Number(envConfig.SALT_ROUNDS),
	);

	// -----otp generate
	const otp = crypto.randomInt(100000, 1000000).toString();

	// -----redis data set
	const expirationSecound = 5 * 60;
	const otpKey = `user-registration-otp:${email}`;

	// ---otp set on redis
	await redisClient.set(otpKey, otp, {
		expiration: {
			type: "EX",
			value: expirationSecound,
		},
	});

	// ---sugnup data set on redis
	const signupDataKey = `user-signup-data:${email}`;

	const userDataPayload = JSON.stringify({
		name,
		email,
		password: hashedPassword,
		bloodGroup,
	});

	await redisClient.set(signupDataKey, userDataPayload, {
		expiration: {
			type: "EX",
			value: 6 * 60,
		},
	});

	// ------sending mail
	await mailSender({
		email,
		subject: "verify your email",
		mailTemp: OTPMailTemp(otp, 5),
	});

	return;
};

// -------otp verify and create user Services
const otpVerifyServices = async (payload: IOtpVerify) => {
	const { email, otp } = payload;

	// ------checking if user already exist/verified/blocked
	const userExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (userExist?.emailVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "You email already verified");
	}

	if (userExist?.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"user is blocked. Please contact our support team",
		);
	}

	if (userExist?.status === UserStatus.DELETED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"user is deleted. Please contact our support team",
		);
	}

	// ------getting user otp from redis
	const otpKey = `user-registration-otp:${email}`;

	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Otp expired. please try again later",
		);
	}

	// -------checkin if otp is correct or not
	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "your otp is not correct");
	}

	// -------getting user signup data from redis
	const signupDataKey = `user-signup-data:${email}`;

	const signupData = await redisClient.get(signupDataKey);

	if (!signupData) {
		throw new AppError(
			httpStatus.INTERNAL_SERVER_ERROR,
			"Something bad please try again later",
		);
	}

	const signupPayload: ISignup = JSON.parse(signupData);

	// ------creating user
	const createdUser = await prisma.user.create({
		data: {
			name: signupPayload.name,
			email: signupPayload.email,
			password: signupPayload.password,
			bloodGroup: signupPayload.bloodGroup,
			emailVerified: true,
		},
		omit: {
			password: true,
		},
	});

	// ------deleting used data from redis
	await redisClient.del([otpKey, signupDataKey]);

	// -----getting jwt data
	const jwtPayload = {
		userId: createdUser.id,
		name: createdUser.name,
		email: createdUser.email,
		Role: createdUser.role,
	};

	// ------generating jwt token
	const accessToken = jwtUtils.createToken(
		jwtPayload,
		envConfig.JWT_ACCESS_SECRET as string,
		envConfig.JWT_ACCESS_EXPIRES_IN as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		envConfig.JWT_REFRESH_SECRET as string,
		envConfig.JWT_REFRESH_EXPIRES_IN as SignOptions,
	);

	// -----sending user welcome mail
	await mailSender({
		email: createdUser.email,
		subject: "Welcome to Blood For Life Community",
		mailTemp: WelcomeMailTemp(
			createdUser.name,
			`${envConfig.frontend_url}/dashboard`,
		),
	});

	return {
		createdUser,
		accessToken,
		refreshToken,
	};
};

export const authServices = { signupServices, otpVerifyServices };
