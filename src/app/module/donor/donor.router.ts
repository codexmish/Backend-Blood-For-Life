import { Router } from "express";
import { donorController } from "./donor.controller";
import { limiter } from "../../utils/requestLimiter";
import { zodValidation } from "../../middleWares/zodValidation";
import { registerDonorSchema } from "./donor.validation";
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

export const donorRouter = router;
