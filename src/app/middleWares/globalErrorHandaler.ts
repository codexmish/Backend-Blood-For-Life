import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";

export const globalErrorHandaler = async(err: any, req: Request, res:Response, next: NextFunction)=>{


    // -----initial error res data
    let statusCode = null
    let errMessage = err.message
    let errorName = err.name || "Internal server error"

    

    // -----err set for prisma error
    if(err instanceof Prisma.PrismaClientValidationError){
        statusCode = httpStatus.BAD_REQUEST
        errMessage = "You have provided incorrect data type or missing data"
    }else if(err instanceof Prisma.PrismaClientKnownRequestError){
        if(err.code === "p2002"){
            statusCode = httpStatus.BAD_REQUEST
            errMessage = "Duplicate key Error"
        }else if(err.code === "p2003"){
            statusCode = httpStatus.BAD_REQUEST
            errMessage = "Foreign key constraint failed"
        }else if(err.code === "p2025"){
            statusCode = httpStatus.BAD_REQUEST
            errMessage = "An operation failed because it depends on one or more records that were required but not found. "
        }
    }else if(err instanceof Prisma.PrismaClientInitializationError){
        statusCode = httpStatus.INTERNAL_SERVER_ERROR
        errMessage = "The provided credentials for the database are invalid"
    }else if(err instanceof Prisma.PrismaClientUnknownRequestError){
        statusCode = httpStatus.INTERNAL_SERVER_ERROR
        errMessage = "Error occures during query exicution"
    }


    // ------final err response send to client
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: statusCode || httpStatus.INTERNAL_SERVER_ERROR,
        name: errorName,
        message: errMessage,
        error: err.stack
    })
}