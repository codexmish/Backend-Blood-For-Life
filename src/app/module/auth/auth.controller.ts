import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";


// --------sign up user controller
const signupController = catchAsync(async(req: Request, res: Response)=>{
    sendResponse(res,{
        statusCode: 200,
        success: true,
        message: "sfsaf",
        data: ""
    })
})


export const authControllers = {signupController}