import z from "zod";

// -----register donor validation
export const registerDonorSchema = z.object({
	weight: z
		.string("Weight must be a string")
		.trim()
		.regex(/^\d{2,3}(\.\d{1,2})?$/, "Weight must be a number in kg")
		.refine((value) => Number(value) >= 50, "Minimum weight to donate is 50 kg")
		.optional(),

	healthNote: z
		.string("Health note must be a string")
		.trim()
		.max(300, "health note max 300 caracters long")
		.optional(),

	// ----accepts only "YYYY-MM-DD", can't be in the future
	lastDonationDate: z.iso
		.date("Invalid date, use YYYY-MM-DD")
		.transform((value) => new Date(value))
		.refine(
			(date) => date <= new Date(),
			"Last donation date can't be in the future",
		)
		.optional(),
});

// -----update donor profile validation (same fields, at least one required)
export const updateDonorSchema = registerDonorSchema.refine(
	(data) => Object.values(data).some((value) => value !== undefined),
	{
		message: "Provide at least one field to update",
	},
);

// -----donor availability validation
export const donorAvailabilitySchema = z.object({
	isAvailable: z.boolean("isAvailable must be true or false"),
});
