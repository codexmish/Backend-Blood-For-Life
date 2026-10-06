import z from "zod";

// -----update profile validation
export const updateProfileSchema = z
	.object({
		name: z
			.string("Name must be a string")
			.trim()
			.min(3, "name must be 3 caracters long")
			.max(50, "name max 50 caracters long")
			.optional(),

		// ----bangladeshi number: 01XXXXXXXXX
		phone: z
			.string("Phone must be a string")
			.trim()
			.regex(/^(?:\+?88)?01[3-9]\d{8}$/, "Invalid phone number")
			.optional(),

		address: z
			.string("Address must be a string")
			.trim()
			.min(3, "address must be 3 caracters long")
			.max(200, "address max 200 caracters long")
			.optional(),
	})
	.refine((data) => Object.values(data).some((value) => value !== undefined), {
		message: "Provide at least one field to update",
	});
