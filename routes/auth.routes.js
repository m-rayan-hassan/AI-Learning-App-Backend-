import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  deleteUser,
  getProfile,
  updateProfile,
  refreshAccessToken,
  logoutUser,
  updateProfileImage,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
import uploadImage from "../utils/imageMulter.js";
import { multerErrorHandler } from "../middlewares/multerErrorMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);
router.delete("/delete", protect, deleteUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put(
  "/update-profile-image",
  protect,
  uploadImage.single("profileImage"),
  multerErrorHandler,
  updateProfileImage,
);

export default router;
