import { Router } from "express";
import { authCheck } from "../../middleWares/authCheck";
import { Role } from "../../../generated/prisma/enums";
import { donationControllers } from "./donation.controller";

const router = Router();

// -----get my commitments (keep above "/:requestId")
router.get(
	"/my-commitments",
	authCheck(Role.DONOR),
	donationControllers.getMyCommitmentsController,
);

// -----get my donations (keep above "/:requestId")
router.get(
	"/my-donations",
	authCheck(Role.DONOR),
	donationControllers.getMyDonationsController,
);

// -----get public donations, no login (keep above "/:requestId")
router.get("/public", donationControllers.getPublicDonationsController);

// -----donate to blood request (keep "/my-..." and "/public" routes above this)
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
