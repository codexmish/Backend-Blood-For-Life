import { BloodGroupList, Urgency } from "../../../generated/prisma/enums";

export interface ICreateBloodRequest {
	patientName: string;
	bloodGroup: BloodGroupList;
	bagsNeeded: number;
	hospitalName: string;
	address: string;
	urgency?: Urgency;
	needAt: Date;
	phoneNumber: string;
	note?: string;
}
