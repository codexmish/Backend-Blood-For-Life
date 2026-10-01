import { ISignup, ISignupErrors } from "./auth.interface"
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appErro";
import httpStatus from "http-status";
import bcrypt from "bcrypt"
import envConfig from "../../envConfig";


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


}



export const authServices = {signupServices}