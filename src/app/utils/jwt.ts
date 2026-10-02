import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const createToken = (
	payload: JwtPayload,
	sercret: string,
	expiresIn: SignOptions,
) => {
	const token = jwt.sign(payload, sercret, {
		expiresIn,
	} as SignOptions);

	return token;
};

const verifyToken = (token: string, sercret: string) => {
	try {
		const verifiedToken = jwt.verify(token, sercret);
		return {
			success: true,
			data: verifiedToken,
		};
	} catch (error: any) {
		return {
			success: false,
			message: error.message,
		};
	}
};

export const jwtUtils = { createToken, verifyToken };
