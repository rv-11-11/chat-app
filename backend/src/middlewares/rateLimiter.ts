import { Request, Response, NextFunction } from "express";

type Bucket = { tokens: number; lastRefill: number };
const BUCKETS = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 300;

export const rateLimiter = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    const now = Date.now();
    const bucket = BUCKETS.get(ip) || { tokens: MAX_REQUESTS, lastRefill: now };

    const elapsed = now - bucket.lastRefill;
    if (elapsed > WINDOW_MS) {
      bucket.tokens = MAX_REQUESTS;
      bucket.lastRefill = now;
    }

    if (bucket.tokens <= 0) {
      res.status(429).json({ message: "Too many requests. Please try again later." });
      return;
    }

    bucket.tokens -= 1;
    BUCKETS.set(ip, bucket);
    next();
  };
};
