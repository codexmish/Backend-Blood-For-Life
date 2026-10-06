import { Router } from "express";
import { donorController } from "./donor.controller";
import { limiter } from "../../utils/requestLimiter";
import { zodValidation } from "../../middleWares/zodValidation";
import { registerDonorSchema, updateDonorSchema } from "./donor.validation";
import { authCheck } from "../../middleWares/authCheck";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// -----register donor
router.post(
	"/register",
	limiter(5 * 60 * 1000, 5, false),
	authCheck(Role.RECIPIENT),
	zodValidation(registerDonorSchema),
	donorController.registerDonor,
);

// -----update donor profile
router.patch(
	"/me",
	authCheck(Role.DONOR),
	zodValidation(updateDonorSchema),
	donorController.updateDonorProfile,
);

// -----get all donor
router.get("/donors", authCheck(), donorController.getAllDonor);

// -----get single donor (keep below "/donors", otherwise "donors" is read as an id)
router.get("/:id", authCheck(), donorController.getSingleDonor);

export const donorRouter = router;
