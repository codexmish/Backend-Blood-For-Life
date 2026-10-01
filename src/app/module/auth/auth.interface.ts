import { BloodGroupList } from "../../../generated/prisma/enums";

export interface ISignup {
	name: string;
	email: string;
	bloodGroup: BloodGroupList;
	password: string;
}

export interface ISignupErrors {
	name?: string;
	email?: string;
	bloodGroup?: string;
	password?: string;
}
