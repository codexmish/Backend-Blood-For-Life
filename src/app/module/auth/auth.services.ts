import { ISignup, ISignupErrors } from "./auth.interface"
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appErro";
import httpStatus from "http-status";
import bcrypt from "bcrypt"
import envConfig from "../../envConfig";
import crypto from "crypto"
import { redisClient } from "../../lib/redis";


// ---------signup services
const signupServices = async(payload: ISignup)=>{
    const {name, email, bloodGroup, password} = payload


    // -----checking if user already exist with same email
    const userExist = await prisma.user.findUnique({
        where:{
            email
        }
    })

    if(userExist){
        throw new AppError(httpStatus.BAD_REQUEST, "User already exist with this email")
    }

    // -----password hash
    const hashedPassword = await bcrypt.hash(password, Number(envConfig.SALT_ROUNDS))

    // -----otp generate
    const otp =  crypto.randomInt(100000, 1000000).toString();

    // -----redis data set
    const expirationSecound = 5 * 60;
    const otpKey = `user-registration-otp:${email}`

    // ---otp set on redis
    await redisClient.set(otpKey, otp,{
        expiration:{
            type: "EX",
            value: expirationSecound
        }
    })


    // ---sugnup data set on redis
    const signupDataKey = `user-signup-data:${email}`

    const userDataPayload = JSON.stringify({
        name,
        email,
        password: hashedPassword,
        bloodGroup
    })



    await redisClient.set(signupDataKey, userDataPayload,{
        expiration:{
            type: "EX",
            value: expirationSecound
        }
    })


}



export const authServices = {signupServices}