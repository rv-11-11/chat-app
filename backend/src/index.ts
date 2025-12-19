import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";
import session from "express-session";
import http from "http";
import passport from "passport";
import path from "path";
import connectDatabase from "./config/database.config";
import { Env } from "./config/env.config";
import { HTTPSTATUS } from "./config/http.config";
import { initializeSocket } from "./lib/socket";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import routes from "./routes";

import "./config/passport.config";

const app = express();
const server = http.createServer(app);

//socket
initializeSocket(server);

// Increase body size limits to support base64 video uploads from the client
// 200mb is generous for client-side base64 video uploads; consider direct multipart/signed uploads for production
app.use(express.json({ limit: "200mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "200mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // In development, allow any localhost origin (for Expo, Vite, etc.)
      if (Env.NODE_ENV === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }
      
      // List of allowed origins for production
      const allowedOrigins = [
        Env.FRONTEND_ORIGIN, // Vite dev server / production frontend
      ];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Trust first proxy (Nginx)
app.set('trust proxy', 1);

// Session configuration for Nginx reverse proxy with MongoDB store
app.use(
  session({
    secret: Env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: Env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 24 hours in seconds
      autoRemove: 'native', // Let MongoDB handle TTL
    }),
    proxy: true, // Trust the reverse proxy
    cookie: {
      secure: false, // Set to false for HTTP (change to true when using HTTPS)
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // CSRF protection
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/health",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
      message: "Server is healthy",
      status: "OK",
    });
  })
);

app.use("/api", routes);

if (Env.NODE_ENV === "production") {
  const clientPath = path.resolve(__dirname, "../../client/dist");

  //Serve static files
  app.use(express.static(clientPath));

  app.get(/^(?!\/api).*/, (req: Request, res: Response) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

app.use(errorHandler);

const PORT = Number(Env.PORT);
server.listen(PORT, '0.0.0.0', async () => {
  await connectDatabase();
  console.log(`Server running on port ${PORT} in ${Env.NODE_ENV} mode`);
  console.log(`Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`For physical devices, use your local IP address`);
});
