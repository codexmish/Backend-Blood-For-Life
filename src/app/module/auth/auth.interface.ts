import { BloodGroupList } from "../../../generated/prisma/enums";

export interface ISignup {
	name: string;
	email: string;
	bloodGroup: BloodGroupList;
	password: string;
}

export interface IOtpVerify {
	email: string;
	otp: string;
}
