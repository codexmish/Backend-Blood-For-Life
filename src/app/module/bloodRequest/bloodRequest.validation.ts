import z from "zod";
import {
	BloodGroupList,
	BloodrequestStatus,
	Urgency,
} from "../../../generated/prisma/enums";

export const createBloodRequestValidationSchema = z.object({
	patientName: z
		.string("Patient name needed")
		.trim()
		.min(3, "Patient name must me 3 characters long")
		.max(50, "Patient name max 50 characters long"),
	bloodGroup: z.enum(BloodGroupList, "Invalid Blood Group"),
	bagsNeeded: z
		.number("Bags needed must be a number")
		.int("Bags needed must be a whole number")
		.min(1, "At least 1 bag is required")
		.max(5, "Maximum 5 bags allowed"),
	hospitalName: z
		.string("Hospital name needed")
		.trim()
		.min(3, "Hospital name must me 3 characters long")
		.max(100, "Hospital name max 100 characters long"),
	address: z
		.string("Address needed")
		.trim()
		.min(3, "Address must me 3 characters long")
		.max(200, "Address max 200 characters long"),
	urgency: z.enum(Urgency).optional(),
	needAt: z.iso
		.date("Invalid date, use YYYY-MM-DD")
		.transform((value) => new Date(value))
		.refine((date) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			return date >= today;
		}, "Needed date can't be in the past"),
	phoneNumber: z
		.string("Phone must be a string")
		.trim()
		.regex(/^(?:\+?88)?01[3-9]\d{8}$/, "Invalid phone number"),
	note: z
		.string("Note must be a string")
		.trim()
		.min(3, "Note must me 3 characters long")
		.max(200, "Note max 200 characters long")
		.optional(),
});

// -----update request status validation (OPEN not allowed, it is the default)
export const updateRequestStatusValidationSchema = z.object({
	status: z.enum(
		[BloodrequestStatus.FULFILLED, BloodrequestStatus.CANCELLED],
		"Status must be FULFILLED or CANCELLED",
	),
});
