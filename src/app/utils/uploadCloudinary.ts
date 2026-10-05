import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../lib/cloudinary";

export const uploadCloudinary = (buffer: Buffer, folder: string) => {
	return new Promise<UploadApiResponse>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{
					folder,
					resource_type: "auto",
				},
				(err, result) => {
					if (err || !result) {
						return reject(err);
					}
					resolve(result);
				},
			)
			.end(buffer);
	});
};
