import { v2 as Cloudinary } from "cloudinary";
import envConfig from "../envConfig";

Cloudinary.config({
	cloud_name: envConfig.CLOUDINARY_CLOUD_NAME,
	api_key: envConfig.CLOUDINARY_API_KEY,
	api_secret: envConfig.CLOUDINARY_API_SECRET,
});

export const cloudinary = Cloudinary;
