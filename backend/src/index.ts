import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";
import session from "express-session";
import http from "http";
import passport from "passport";
import path from "path";
import helmet from "helmet";
import connectDatabase from "./config/database.config";
import { Env } from "./config/env.config";
import { HTTPSTATUS } from "./config/http.config";
import { initializeSocket } from "./lib/socket";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import routes from "./routes";
import { rateLimiter } from "./middlewares/rateLimiter";

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
      // Allow mobile apps, Postman, server-to-server
      if (!origin) return callback(null, true);

      // Allow configured frontend origin if present
      const allowedOrigins = [Env.FRONTEND_ORIGIN];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Basic rate limiting
app.use(rateLimiter());

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
      secure: Env.NODE_ENV === 'production',
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

// Legal: Privacy Policy (HTML)
app.get(
  "/legal/privacy",
  asyncHandler(async (req: Request, res: Response) => {
    res.type("html").send(`
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Privacy Policy</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 16px; line-height: 1.6; }
          h1, h2 { color: #111827; }
          p, li { color: #374151; }
          ul { margin-left: 20px; }
          .muted { color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Privacy Policy</h1>
        <p>This Privacy Policy explains how we collect, use, and protect your information when you use our app.</p>
        <h2>Data We Collect</h2>
        <ul>
          <li>Account data: name, email, username</li>
          <li>Content you create: messages, media, profile</li>
          <li>Device and diagnostics for service reliability</li>
        </ul>
        <h2>How We Use Data</h2>
        <ul>
          <li>Deliver core features like messaging and notifications</li>
          <li>Maintain security and prevent abuse</li>
          <li>Comply with legal obligations</li>
        </ul>
        <h2>Cookies & Local Storage</h2>
        <p>We use cookies and local storage for session management, preferences, and authentication. You can control notifications and certain preferences within the app.</p>
        <h2>Data Sharing</h2>
        <p>We do not sell your data. We may share limited information with service providers strictly to operate the app.</p>
        <h2>Security</h2>
        <p>We implement technical and organizational measures to protect your information. No method of transmission is 100% secure, but we work to safeguard data.</p>
        <h2>Retention</h2>
        <p>We keep information only as long as necessary to provide services and meet legal requirements. You may request deletion subject to lawful exceptions.</p>
        <h2>Children's Privacy</h2>
        <p>Our app is not directed to children under the age of 13. If you believe a child has provided us information, contact us to remove it.</p>
        <h2>Your Rights</h2>
        <ul>
          <li>Access, correction, and deletion of your data</li>
          <li>Objection or restriction of certain processing</li>
          <li>Data portability where applicable</li>
        </ul>
        <h2>Contact</h2>
        <p>For privacy requests, contact: support@example.com</p>
        <p class="muted">We may update this Privacy Policy; continued use after updates constitutes acceptance.</p>
      </body>
      </html>
    `);
  })
);

if (false && Env.NODE_ENV === "production") {
  const clientPath = path.resolve(__dirname, "../../client/dist");

  app.use(express.static(clientPath));

  app.get(/^(?!\/api).*/, (req: Request, res: Response) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

app.use(errorHandler);


const PORT = Number(process.env.PORT) || Env.PORT || 3000;

server.listen(PORT, async () => {
  await connectDatabase();
  console.log(`🚀 Server running on port ${PORT} in ${Env.NODE_ENV} mode`);
});
