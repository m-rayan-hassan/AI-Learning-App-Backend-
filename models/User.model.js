import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      }, // Required if not logging in via Google
    },
    profileImage: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    googleId: {
      type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // ─── Paddle / Subscription Fields ───
    paddleCustomerId: { type: String },       // "ctm_01..."
    paddleSubscriptionId: { type: String },   // "sub_01..." — needed for upgrades & cancels

    planType: {
      type: String,
      enum: ["free", "plus", "pro", "premium"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "past_due", "canceled", "none"],
      default: "none",
    },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    paddleNextBilledAt: { type: Date },

    // Tracks pending scheduled changes (e.g. pending cancellation)
    paddleScheduledChange: {
      action: { type: String },
      effectiveAt: { type: String },
    },

    // Last payment info
    lastPaymentDate: { type: Date },
    lastPaymentAmount: { type: String },
    lastPaymentCurrency: { type: String },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
