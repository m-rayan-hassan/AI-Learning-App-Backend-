import rateLimit from "express-rate-limit";

export const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 30,
  keyGenerator: (req) => req.user.id,
  message: "Daily AI limit reached (30/day)",
});
