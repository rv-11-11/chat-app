import { ErrorRequestHandler } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { AppError, ErrorCodes } from "../services/utils/app-error";

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  // Don't log expected 401 errors for auth status check (normal when not logged in)
  const isExpectedAuthError = 
    req.path === '/api/auth/status' && 
    error instanceof AppError && 
    error.statusCode === 401;

  if (!isExpectedAuthError) {
    console.log(`Error occurred: ${req.path}`, error);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Something went wrong",
    errorCode: ErrorCodes.ERR_INTERNAL,
  });
};
