import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { loginService, registerService } from "../services/auth.service";
import { clearJwtAuthCookie, setJwtAuthCookie } from "../services/utils/cookie";
import { loginSchema, registerSchema } from "../validators/auth.validator";

export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body);

    const user = await registerService(body);
    const userId = user._id as string;

    // Set http-only cookie for web clients and also return token for native clients
    const token = setJwtAuthCookie({ res, userId });
    return res.status(HTTPSTATUS.CREATED).json({
      message: "User created & login successfully",
      user,
      token,
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = loginSchema.parse(req.body);

    const user = await loginService(body);
    const userId = user._id as string;
    const token = setJwtAuthCookie({ res, userId });
    return res.status(HTTPSTATUS.OK).json({
      message: "User login successfully",
      user,
      token,
    });
  }
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response) => {
    return clearJwtAuthCookie(res).status(HTTPSTATUS.OK).json({
      message: "User logout successfully",
    });
  }
);

export const authStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    return res.status(HTTPSTATUS.OK).json({
      message: "Authenticated User",
      user,
      // Optionally return token again if desired
      token: undefined,
    });
  }
);
