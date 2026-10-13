import { Router } from "express";
import { authCheck } from "../../middleWares/authCheck";
import { Role } from "../../../generated/prisma/enums";
import { donationControllers } from "./donation.controller";

const router = Router();

// -----donate to blood request (keep "/my-..." and "/public" routes above this later)
router.post(
	"/:requestId",
	authCheck(Role.DONOR),
	donationControllers.donateToRequestController,
);

// -----leave blood request
router.delete(
	"/:requestId",
	authCheck(Role.DONOR),
	donationControllers.leaveRequestController,
);

export const donationRouter = router;
