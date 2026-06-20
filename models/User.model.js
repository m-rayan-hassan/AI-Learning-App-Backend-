import mongoose from "mongoose";

const defaultResetDate = function () {
  const now = new Date();
  now.setMonth(now.getMonth() + 1);
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
      }, 
    },
    profileImage: {
      type: String,
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    googleId: {
      type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    planType: {
      type: String,
      enum: ["free", "plus", "pro", "premium"],
      default: "free",
    },
    lsCustomerId: { 
      type: String,
      default: null 
    },
    lsSubscriptionId: { 
      type: String,
      default: null
    },
    subscriptionStatus: { 
      type: String, 
      enum: ["active", "past_due", "canceled", "none"],
      default: "none" 
    }, 
    subscriptionVariantId: { 
      type: String, 
      default: null 
    },
    renewsAt: { 
      type: Date, 
      default: null 
    },
    endsAt: { type: Date,
      default: null 
    },
    updatePaymentMethodUrl: { 
      type: String, 
      default: null 
    },
    customerPortalUrl: { 
      type: String,
      default: null
    },
    customerPortalUpdateSubscriptionUrl: {
      type: String,
      default: null
    },

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
