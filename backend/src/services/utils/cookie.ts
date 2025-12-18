import { Response } from "express";
import jwt from "jsonwebtoken";
import { Env } from "../../config/env.config";

type Time = `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;
type Cookie = {
  res: Response;
  userId: string;
};

export const setJwtAuthCookie = ({ res, userId }: Cookie) => {
  const payload = { userId };
  const expiresIn = Env.JWT_EXPIRES_IN as Time;
  const token = jwt.sign(payload, Env.JWT_SECRET, {
    audience: ["user"],
    expiresIn: expiresIn || "7d",
  });

  // Set cookie for browser clients
  res.cookie("accessToken", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false, // Set to false for HTTP, true for HTTPS
    sameSite: "lax", // Important for Nginx proxy
    path: "/", // Ensure cookie is available for all paths
  });

  // Return the token string as well for native clients to consume
  return token;
};

export const clearJwtAuthCookie = (res: Response) =>
  res.clearCookie("accessToken", { path: "/" });
