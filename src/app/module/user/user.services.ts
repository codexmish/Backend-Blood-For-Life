import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middleWares/authCheck";
import { AppError } from "../../utils/appErro";
import { uploadCloudinary } from "../../utils/uploadCloudinary";
import { IUpdateProfile } from "./user.interface";
import httpStatus from "http-status";

// ------update profile services
const updateProfile = async (payload: IUpdateProfile, user: RequestUser) => {
	// -----checking user exist or not
	const userExist = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
	});

	if (!userExist) {
		throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
	}

	// --------updating profile
	const updateProfile = await prisma.user.update({
		where: {
			id: userExist.id,
		},
		data: payload,
		omit: {
			password: true,
		},
	});

	return updateProfile;
};

// -------avater upload services
const avaterUpload = async (avaterBuffer: Buffer, userId: string) => {
	if (!avaterBuffer) {
		throw new AppError(httpStatus.NOT_FOUND, "File not found");
	}

	// -----checking if userExist
	const userExist = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		omit: {
			password: true,
		},
	});

	if (!userExist) {
		throw new AppError(httpStatus.BAD_REQUEST, "You are not permitteed");
	}

	// ------uploading to cloudinary
	const avaterData = await uploadCloudinary(avaterBuffer, "avater");

	// ------updatig userData
	const updateduser = await prisma.user.update({
		where: {
			id: userExist.id,
		},
		data: {
			avater: avaterData.secure_url,
			avaterPublicId: avaterData.public_id,
		},
		omit: {
			password: true,
		},
	});

	// -----deleting previous avater
	if (userExist.avaterPublicId) {
		await cloudinary.uploader.destroy(userExist.avaterPublicId);
	}

	return updateduser;
};

export const userServices = { updateProfile, avaterUpload };

// {
//   asset_id: 'f3479b795a03e01320377a42e08ec144',
//   public_id: 'avater/wmbkqobet7dlmzeiwcjr',
//   version: 1791200506,
//   version_id: '4cad6adf2f2500200e9beaca93583714',
//   signature: '609478ecbbe792fe5d375d4106cf56c3c6db188c',
//   width: 554,
//   height: 554,
//   format: 'jpg',
//   resource_type: 'image',
//   created_at: '2026-10-05T11:41:46Z',
//   tags: [],
//   bytes: 19418,
//   type: 'upload',
//   etag: '9e48361093130eb1751a9bd7091aca4e',
//   placeholder: false,
//   url: 'http://res.cloudinary.com/dstlofcbq/image/upload/v1791200506/avater/wmbkqobet7dlmzeiwcjr.jpg',
//   secure_url: 'https://res.cloudinary.com/dstlofcbq/image/upload/v1791200506/avater/wmbkqobet7dlmzeiwcjr.jpg',
//   asset_folder: 'avater',
//   display_name: 'wmbkqobet7dlmzeiwcjr',
//   original_filename: 'file',
//   api_key: '414288883955627'
// }
