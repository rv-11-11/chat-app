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
  // Determine if we're in HTTPS (production) or HTTP (development)
  const isSecure = Env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
  
  res.cookie("accessToken", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isSecure, // true for HTTPS (production), false for HTTP (development)
    sameSite: isSecure ? "none" : "lax", // "none" for cross-origin HTTPS, "lax" for same-origin or HTTP
    path: "/", // Ensure cookie is available for all paths
    // Add domain if needed for cross-subdomain cookies (uncomment if needed)
    // domain: process.env.COOKIE_DOMAIN,
  });

  // Return the token string as well for native clients to consume
  return token;
};

export const clearJwtAuthCookie = (res: Response) => {
  const isSecure = Env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
  res.clearCookie("accessToken", { 
    path: "/",
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
  });
};
