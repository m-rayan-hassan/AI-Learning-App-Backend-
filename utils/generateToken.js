import jwt from 'jsonwebtoken';

/**
 * Generate a short-lived access token (15 minutes).
 * Sent in JSON response body, stored in memory on the client.
 */
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

/**
 * Generate a long-lived refresh token (7 days).
 * Sent as an HttpOnly cookie, never accessible to JavaScript.
 */
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

// Keep backward-compatible default export (uses access token)
const generateToken = generateAccessToken;
export default generateToken;