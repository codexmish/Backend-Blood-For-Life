import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";


// --------sign up user controller
const signupController = catchAsync(async(req: Request, res: Response)=>{
    // const result = 
})


export const authControllers = {signupController}