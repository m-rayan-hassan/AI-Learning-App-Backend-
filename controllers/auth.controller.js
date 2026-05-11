import User from "../models/User.model.js";
import fs from "fs";
import path from "path";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";
import Joi from "joi";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Document from "../models/Document.model.js";
import Flashcard from "../models/Flashcard.model.js";
import Quiz from "../models/Quiz.model.js";
import VoiceOverview from "../models/VoiceOverview.model.js";
import VideoOverview from "../models/VideoOverview.model.js";
import ChatHistory from "../models/ChatHistory.model.js";
import {
  deleteMedia,
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../config/cloudinary.js";

// ─── In-Memory OTP Pending Store ─────────────────────────────────────────────
// Keyed by lowercase email. Entries auto-expire after OTP_EXPIRE_MS.
const OTP_EXPIRE_MS = 10 * 60 * 1000; // 10 minutes
const pendingRegistrations = new Map();
// Periodically clean expired entries to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of pendingRegistrations.entries()) {
    if (entry.otpExpire < now) pendingRegistrations.delete(email);
  }
}, 5 * 60 * 1000); // every 5 minutes

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Cookie Configuration ───────────────────────────────────────────
const REFRESH_COOKIE_NAME = "refreshToken";

const getRefreshCookieOptions = () => ({
  httpOnly: true, // Not accessible via JavaScript (XSS protection)
  secure: true, // HTTPS required for cross-site cookies
  sameSite: "none", // Must be "none" for cross-origin deployments (e.g. Vercel -> Railway)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: "/", // Available on all routes
});

/**
 * Helper: Set tokens and send response.
 * - accessToken → JSON body (stored in-memory on client)
 * - refreshToken → HttpOnly cookie (auto-sent by browser)
 */
const sendTokenResponse = (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.status(statusCode).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    profileImage: user.profileImage,
    accessToken,
  });
};

// Validation Schemas
const registerSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// @desc    Register new user (legacy direct-create — kept for internal use)
export const registerUser = async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    sendTokenResponse(res, user, 201);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Step 1 — Send OTP to email for signup verification
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOtp = async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email, password } = req.body;
  const lowerEmail = email.toLowerCase();

  try {
    // Reject if the email is already registered
    const userExists = await User.findOne({ email: lowerEmail });
    if (userExists)
      return res.status(400).json({ message: "An account with this email already exists" });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Hash the password so we never store plaintext
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store pending registration
    pendingRegistrations.set(lowerEmail, {
      username,
      hashedPassword,
      otpHash,
      otpExpire: Date.now() + OTP_EXPIRE_MS,
    });

    // Send OTP email
    const htmlMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 0; margin: 0; background-color: #F8FAFC; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 24px; font-weight: 700; color: #3B82F6; margin: 0; }
        .content { color: #0b1220; font-size: 16px; line-height: 1.6; }
        .otp-box { text-align: center; margin: 35px 0; }
        .otp-code { display: inline-block; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #3B82F6; background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: 12px; padding: 18px 32px; }
        .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #64748B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><div class="logo-text">Cognivio AI</div></div>
        <div class="content">
          <p>Hello ${username},</p>
          <p>Thanks for signing up! Use the verification code below to complete your registration.</p>
          <div class="otp-box"><div class="otp-code">${otp}</div></div>
          <p style="font-size:14px;color:#64748B;">This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} Cognivio AI. All rights reserved.</p></div>
      </div>
    </body>
    </html>
    `;

    await sendEmail({
      email: lowerEmail,
      subject: "Your Cognivio AI verification code",
      message: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      html: htmlMessage,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("sendOtp error:", err.message);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// @desc    Step 2 — Verify OTP and create account
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  const lowerEmail = email.toLowerCase();
  const pending = pendingRegistrations.get(lowerEmail);

  if (!pending)
    return res.status(400).json({ message: "No pending registration found. Please sign up again." });

  if (Date.now() > pending.otpExpire) {
    pendingRegistrations.delete(lowerEmail);
    return res.status(400).json({ message: "OTP has expired. Please sign up again." });
  }

  const otpHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");
  if (otpHash !== pending.otpHash)
    return res.status(400).json({ message: "Invalid OTP. Please try again." });

  try {
    // Double-check the email wasn't registered while OTP was pending
    const alreadyExists = await User.findOne({ email: lowerEmail });
    if (alreadyExists) {
      pendingRegistrations.delete(lowerEmail);
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      username: pending.username,
      email: lowerEmail,
      password: pending.hashedPassword,
    });

    pendingRegistrations.delete(lowerEmail);
    sendTokenResponse(res, user, 201);
  } catch (err) {
    console.error("verifyOtp error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();

    if (
      user.planType === "free" &&
      now >= new Date(user.quotas.document.resetDate)
    ) {
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1);

      // 2. Reset quota and update the reset date to next month
      user.quotas.document.count = 0;
      user.quotas.document.resetDate = nextReset;
      user.quotas.flashcard.count = 0;
      user.quotas.flashcard.resetDate = nextReset;
      user.quotas.quiz.count = 0;
      user.quotas.quiz.resetDate = nextReset;
      user.quotas.voiceOverview.count = 0;
      user.quotas.voiceOverview.resetDate = nextReset;
      user.quotas.video.count = 0;
      user.quotas.video.resetDate = nextReset;

      await user.save();
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      planType: user.planType,
      subscriptionStatus: user.subscriptionStatus,
      renewsAt: user.renewsAt,
      customerPortalUrl: user.customerPortalUrl,
      quotas: user.quotas,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update User Profile
export const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username) user.username = username;

    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Please provide a profile Image",
      });
    }

    const profileImagePath = req.file.path;

    let uploadResult;
    try {
      uploadResult = await uploadMedia(profileImagePath);
    } finally {
      // Always delete the local temp file, regardless of upload success/failure
      fs.unlink(profileImagePath, (err) => {
        if (err) console.error("Failed to delete temp profile image:", err.message);
      });
    }

    const profileImageUrl = uploadResult.secure_url;

    const user = await User.findOne({ _id: req.user._id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profileImage = profileImageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: profileImageUrl,
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Login user
export const loginUser = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      sendTokenResponse(res, user);
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Google Login
export const googleLogin = async (req, res) => {
  const { token } = req.body; // Token from frontend

  try {
    let name, email, picture, sub;

    // Try to verify as ID token first
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      name = payload.name;
      email = payload.email;
      picture = payload.picture;
      sub = payload.sub;
    } catch (verifyErr) {
      // Fallback: treat as access token and fetch userinfo
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Google userinfo");
      }
      const userinfo = await response.json();
      name = userinfo.name;
      email = userinfo.email;
      picture = userinfo.picture;
      sub = userinfo.sub || userinfo.user_id;
    }

    let user = await User.findOne({ email });

    if (user) {
      // If user exists but logic handled differently (e.g. update googleId)
      if (!user.googleId) {
        user.googleId = sub;
        user.profileImage = picture || user.profileImage;
        await user.save();
      }
    } else {
      // Create new user via Google
      user = await User.create({
        username: name,
        email,
        profileImage: picture,
        googleId: sub,
        password: crypto.randomBytes(16).toString("hex"), // Random password for security
      });
    }

    sendTokenResponse(res, user);
  } catch (err) {
    console.error("Google login error:", err.message);
    res
      .status(500)
      .json({ message: "Google authentication failed", error: err.message });
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public (uses HttpOnly cookie)
export const refreshAccessToken = async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Token rotation: issue new pair for security
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    // Clear invalid cookie
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

// @desc    Logout user (clear refresh cookie)
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and save to DB
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Please go to this link: \n\n ${resetUrl}`;

    const htmlMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 0; margin: 0; background-color: #F8FAFC; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 24px; font-weight: 700; color: #3B82F6; text-decoration: none; margin: 0; }
        .content { color: #0b1220; font-size: 16px; line-height: 1.6; }
        .button-container { text-align: center; margin: 35px 0; }
        .button { background-color: #3B82F6; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 0 15px -3px rgba(59, 130, 246, 0.4); }
        .button:hover { background-color: #2563EB; }
        .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #64748B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">Cognivio AI</div>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset the password for your Cognivio AI account. If you didn't make this request, you can safely ignore this email.</p>
          <p>To choose a new password, click the button below:</p>
          <div class="button-container">
            <a href="${resetUrl}" class="button" style="color: #ffffff;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #64748B;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 14px;"><a href="${resetUrl}" style="color: #3B82F6;">${resetUrl}</a></p>
          <p style="font-size: 14px; color: #64748B;">This link will expire in 10 minutes.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Cognivio AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset your Cognivio AI password",
        message,
        html: htmlMessage,
      });
      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reset Password
export const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid Token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, data: "Password updated success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete User
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // 1. Fetch user media documents
      const documents = await Document.find({ userId: user._id });
      const videos = await VideoOverview.find({ userId: user._id });
      const voices = await VoiceOverview.find({ userId: user._id });

      // 2. Delete media from Cloudinary
      for (const doc of documents) {
        try {
          if (doc.originalFilePublicId)
            await deleteMedia(doc.originalFilePublicId);
          if (doc.pdfFilePublicId) await deleteMedia(doc.pdfFilePublicId);
        } catch (err) {
          console.error(
            `Failed to delete media for document ${doc._id}:`,
            err.message,
          );
        }
      }

      for (const video of videos) {
        try {
          if (video.publicId) await deleteVideoFromCloudinary(video.publicId);
        } catch (err) {
          console.error(`Failed to delete video ${video._id}:`, err.message);
        }
      }

      for (const voice of voices) {
        try {
          if (voice.publicId) await deleteVideoFromCloudinary(voice.publicId);
        } catch (err) {
          console.error(
            `Failed to delete voice overview ${voice._id}:`,
            err.message,
          );
        }
      }

      // 3. Delete documents from database
      try {
        const documentIds = documents.map((doc) => String(doc._id));
        if (documentIds.length > 0) {
          const chunkCollection =
            mongoose.connection.db.collection("document_chunks");
          await chunkCollection.deleteMany({
            $or: [
              { documentId: { $in: documentIds } },
              { "metadata.documentId": { $in: documentIds } },
            ],
          });
        }
      } catch (chunkError) {
        console.error("Failed to delete user document chunks:", chunkError);
      }

      await Flashcard.deleteMany({ userId: user._id });
      await Quiz.deleteMany({ userId: user._id });
      await VoiceOverview.deleteMany({ userId: user._id });
      await VideoOverview.deleteMany({ userId: user._id });
      await Document.deleteMany({ userId: user._id });
      await ChatHistory.deleteMany({ userId: user._id });

      await User.deleteOne({ _id: user._id });

      // Clear refresh cookie on account deletion
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });

      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
