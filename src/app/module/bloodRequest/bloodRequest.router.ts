import { Router } from "express";
import { authCheck } from "../../middleWares/authCheck";
import { bloodRequestControllers } from "./bloodRequest.controller";
import { zodValidation } from "../../middleWares/zodValidation";
import { createBloodRequestValidationSchema } from "./bloodRequest.validation";

const router = Router();

// -----create bloodRequest router
router.post(
	"/create",
	authCheck(),
	zodValidation(createBloodRequestValidationSchema),
	bloodRequestControllers.createBloodRequest,
);

// -----get all request
router.get(
	"/requests",
	authCheck(),
	bloodRequestControllers.getAllRequestController,
);


// -----get single request
router.get(
	"/request/:id",
	authCheck(),
	bloodRequestControllers.getSingleRequestController,
);

// -----get all my request
router.get(
	"/my-requests",
	authCheck(),
	bloodRequestControllers.getAllMyRequestController,
);

export const bloodRequestRouter = router;
