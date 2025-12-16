import { getEnv } from "../services/utils/get-env";

export const Env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "8000"),

  MONGO_URI: getEnv(
    "MONGO_URI",
    "mongodb+srv://mohitraghav350_db_user:QRxVPCwjxKIEzE07@cluster0.dmbrr7s.mongodb.net/fiora?retryWrites=true&w=majority"
  ),

  JWT_SECRET: getEnv("JWT_SECRET", "secret_jwt"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "15m"),

  SESSION_SECRET: getEnv(
    "SESSION_SECRET",
    "2f286b1fdb61cfe063e21800a4e7ca87f26fd471a3b50d2309d6230ac1645bc196038903baace31fba3e11abce073c5590bcbf075ee731506576ebf62b4a7b10"
  ),

  FRONTEND_ORIGIN: getEnv(
    "FRONTEND_ORIGIN",
    "http://localhost:8081",
  ).replace(/\/+$/, ""),

  CLOUDINARY_CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME", "dy8qfihsz"),
  CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY", "842725345293151"),
  CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET", "RgslFKTRoUf-TKwFOtOJnSSqt6M"),
} as const;
