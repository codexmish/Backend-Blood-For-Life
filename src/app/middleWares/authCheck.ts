import { NextFunction, Request, Response } from "express";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appErro";
import httpStatus from "http-status";
import { jwtUtils } from "../utils/jwt";
import envConfig from "../envConfig";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface RequestUser {
	userId: string;
	name: string;
	email: string;
	role: Role;
}

declare global {
	namespace Express {
		interface Request {
			user?: RequestUser;
		}
	}
}

export const authCheck = (...requiredRoles: Role[]) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		// ----getting access token
		const token = req.cookies.accessToken;

		if (!token) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"You are not logged in. Please log in to access this resource.",
			);
		}

		// -------verify token
		const veriFiedToken = jwtUtils.verifyToken(
			token,
			envConfig.JWT_ACCESS_SECRET as string,
		);

		if (!veriFiedToken.success) {
			throw new AppError(httpStatus.UNAUTHORIZED, veriFiedToken.error);
		}

		const { userId } = veriFiedToken.data as JwtPayload;

		// ------checking user exist or not
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!user) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"User not found. Please log in again.",
			);
		}

		// ------checking if role permitted
		if (requiredRoles.length && !requiredRoles.includes(user.role)) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Forbidden. You don't have permission to access this resource.",
			);
		}

		if (user.status === UserStatus.BLOCKED) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your account has been blocked. Please contact support.",
			);
		}

		if (user.status === UserStatus.DELETED || user.isDeleted) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your account has been deleted. Please contact support.",
			);
		}

		req.user = {
			userId: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		};

		next();
	});
};
