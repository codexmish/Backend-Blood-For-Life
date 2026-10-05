import { Router } from "express";
import { userControllers } from "./user.controller";
import { authCheck } from "../../middleWares/authCheck";
import { zodValidation } from "../../middleWares/zodValidation";
import { updateProfileSchema } from "./user.validation";
import { upload } from "../../lib/multer";

const router = Router();

// -----update profile router
router.patch(
	"/update",
	authCheck(),
	zodValidation(updateProfileSchema),
	userControllers.profileUpdate,
);

// ------avater upload
router.patch(
	"/avater",
	authCheck(),
	upload.single("avater"),
	userControllers.avaterupload,
);

export const userRouter = router;
