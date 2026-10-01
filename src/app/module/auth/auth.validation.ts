import z from "zod";
import { BloodGroupList } from "../../../generated/prisma/enums";

// -----user signup validation
export const userSignupSchema = z.object({
	name: z.string("NOt a string!!").min(3, "name must be 3 caracters long"),

	email: z.email("Invalid email address").toLowerCase(),

	bloodGroup: z.enum(BloodGroupList, "Invalid blood group"),
	password: z
		.string("NOt a string!!")
		.min(8, "password must be 8 caracters long")
		.max(32, "password max 32 caracters long"),
});
