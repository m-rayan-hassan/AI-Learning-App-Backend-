import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import connectDB from "./database/db.js";
import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/document.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import flashcardRoutes from "./routes/flashcard.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import { paymentWebhook } from "./controllers/payment.controller.js";
import paymentRouter from "./routes/payment.routes.js";
// Load environment variables
dotenv.config();

// Connect to database
await connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - URL whitelist including frontend URLs and Google login
// Google OAuth redirects are handled by the browser, but some client-side SDKs or
// certain OAuth flows (like 'cross-origin' auth) require the Google domain to be whitelisted.
const allowedOrigins = ["http://localhost:3000", "https://accounts.google.com"];

if (process.env.CLIENT_URL) {
  // Split, trim, and remove any trailing slashes to normalize origins
  const urls = process.env.CLIENT_URL.split(",").map((url) =>
    url.trim().replace(/\/$/, ""),
  );
  allowedOrigins.push(...urls);
}


app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow internal requests (no origin) - e.g. from the server itself or server-side scripts
      if (!origin) return callback(null, true);

      // 2. Check if the origin matches our whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Deny everyone else
      console.error(`Blocked by CORS: ${origin}`);
      return callback(
        new Error("CORS: Access denied from this origin."),
        false,
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
  }),
);

// Global rate limiting - more generous in development for hot reload & rapid navigation
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 500,
  message: "Too many requests from this IP, please try again later.",
});

// Security Middleware - configure Helmet to allow cross-origin requests
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
); // Set security HTTP headers
// app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
// app.use(xss()); // Data sanitization against XSS
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use("/api", limiter); // Apply rate limiting to all routes

// Logging Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Webhook
app.post("/webhook", express.raw({ type: "application/json" }), paymentWebhook);

// Body Parser Middleware
app.use(express.json({ limit: "10kb" })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// API Routes
app.get("/", (req, res) => {
  res.send("Hello");
});
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/payments", paymentRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Global Error Handler.
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(err.statusCode || 500).json({
    status: "error",
    message: "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    ` Server running on port ${PORT} in ${process.env.NODE_ENV} mode`,
  );
});
