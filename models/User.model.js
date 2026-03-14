import mongoose from "mongoose";

const defaultResetDate = function () {
  const now = new Date();
  now.setMonth(now.getMonth() + 1); // Exact 1 month from signup
  return now;
};

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
    paddleCustomerId: { type: String }, // "ctm_01..."
    paddleSubscriptionId: { type: String }, // "sub_01..." — needed for upgrades & cancels

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

    // Usage tracking that resets monthly from signup/upgrade date
    quotas: {
      video: {
        count: { type: Number, default: 0 },
        resetDate: { type: Date, default: defaultResetDate },
      },
      flashcard: {
        count: { type: Number, default: 0 },
        resetDate: { type: Date, default: defaultResetDate },
      },
      quiz: {
        count: { type: Number, default: 0 },
        resetDate: { type: Date, default: defaultResetDate },
      },
      voiceOverview: {
        count: { type: Number, default: 0 },
        resetDate: { type: Date, default: defaultResetDate },
      },
      document: {
        count: { type: Number, default: 0 },
        resetDate: { type: Date, default: defaultResetDate },
      },
    },
  },
  { timestamps: true },
);

// Generic method to safely check, increment, and auto-reset user quotas
userSchema.methods.incrementQuota = async function (quotaType) {
  // quotaType should be one of: 'video', 'flashcard', 'quiz', 'voiceOverview', 'document'
  if (!this.quotas || !this.quotas[quotaType]) {
    throw new Error(`Invalid quota type: ${quotaType}`);
  }

  const now = new Date();

  // If the current date has passed the reset threshold, reset the count to 1 and push the resetDate forward by a month
  if (now >= this.quotas[quotaType].resetDate) {
    this.quotas[quotaType].count = 1;

    // Set a new monthly cycle exactly from this moment
    const nextReset = new Date(now);
    nextReset.setMonth(nextReset.getMonth() + 1);
    this.quotas[quotaType].resetDate = nextReset;
  } else {
    // Still in the same month cycle, simply increment usage
    this.quotas[quotaType].count += 1;
  }

  return this.save();
};

const User = mongoose.model("User", userSchema);
export default User;
