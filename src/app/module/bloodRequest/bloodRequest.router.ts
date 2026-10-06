import { Router } from "express";
import { authCheck } from "../../middleWares/authCheck";
import { bloodRequestControllers } from "./bloodRequest.controller";

const router = Router();

// -----create bloodRequest router
router.post("/create", authCheck(), bloodRequestControllers.createBloodRequest);

export const bloodRequestRouter = router;
