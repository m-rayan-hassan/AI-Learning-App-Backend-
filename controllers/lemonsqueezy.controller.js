import {
  createCheckout,
  lemonSqueezySetup,
} from "@lemonsqueezy/lemonsqueezy.js";
import User from "../models/User.model.js";
import dotenv from "dotenv";
import WebhookEventLS from "../models/Webhook.model.js";
import crypto from "crypto";

dotenv.config();

const PLAN_MAPPING = {
  1606318: "plus",
  1606337: "pro",
  1606339: "premium",
};

lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
  onError: (error) => console.error("Lemon Squeezy Error:", error),
});

export const checkout = async (req, res, next) => {
  const { variantId } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      statusCode: 404,
    });
  }

  if (user.subscriptionVariantId) {
    return res.status(200).json({
      success: true,
      message: "User already has subscribed to a plan, returning lsCustomerId to update paln",
      checkoutUrl: user?.customerPortalUrl
    })
  } 

  const newCheckout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID,
    variantId,
    {
      checkoutOptions: {
        embed: false,
        media: false,
      },
      checkoutData: {
        email: user.email,
        custom: {
          userId: user._id.toString(),
        },
      },
      productOptions: {
        redirectUrl: `${process.env.CLIENT_URL}/dashboard?checkout=success`,
      },
    },
  );

  if (newCheckout.error) {
    console.error("Lemon Squeezy Checkout Error:", newCheckout.error);
    return res.status(500).json({
      success: false,
      message: "Failed to create checkout",
      error: newCheckout.error,
    });
  }

  res.status(200).json({
    success: true,
    message: "Checkout successfull",
    checkoutUrl: newCheckout.data.data.attributes.url,
  });
};

export const lsWebhook = async (req, res, next) => {
  try {
    // 1. Signature Verification
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[Webhook] LEMON_SQUEEZY_WEBHOOK_SECRET is not set in environment variables");
      return res.status(500).json({ error: "Server misconfiguration: missing webhook secret" });
    }
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(req.body).digest("hex"), "utf8");
    const signature = Buffer.from(req.get("X-Signature") || "", "utf8");

    if (!crypto.timingSafeEqual(digest, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // 2. Parse Payload
    const payload = JSON.parse(req.body.toString());
    const eventName = payload.meta.event_name;
    const eventId = payload.meta.webhook_id; // LS sends webhook_id, not event_id
    const obj = payload.data.attributes;

    // 3. Idempotency Check
    if (await WebhookEventLS.findOne({ eventId }))
      return res.status(200).send("Already processed");

    const userId = payload.meta.custom_data?.user_id; // LS sends user_id (snake_case)
    if (!userId) {
      console.log("Not userId in payload");
      return res.status(200).send("Ignored: No userId");
    }

    const planName = PLAN_MAPPING[obj.variant_id?.toString()] || "free";

    console.log("Plan name: ", planName);
    

    const baseUpdateData = {
      planType: planName,
      lsCustomerId: obj.customer_id,
      lsSubscriptionId: payload.data.id,
      subscriptionVariantId: obj.variant_id,
      renewsAt: obj.renews_at ? new Date(obj.renews_at) : null,
      endsAt: obj.ends_at ? new Date(obj.ends_at) : null,
      updatePaymentMethodUrl: obj.urls?.update_payment_method || null,
      customerPortalUrl: obj.urls?.customer_portal || null,
    };

    console.log("Handling event: ", eventName);
    
    // 4. Handle Specific Events
    switch (eventName) {
      
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_cancelled":
      case "subscription_expired":
        // Update general sub details.
        // Note: Quota refills are handled in 'subscription_payment_success'
        await User.findByIdAndUpdate(userId, {
          ...baseUpdateData,
          subscriptionStatus: obj.status,
        });
        break;

      case "subscription_payment_failed":
        // PAYMENT FAILED: Status becomes past_due.
        // 🚨 WE DO NOT TOUCH QUOTAS HERE. Let them use leftover quotas.
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: "past_due",
        });
        break;

      case "subscription_payment_success":
      case "subscription_payment_recovered":
        // ⚠️ NOTE: This event sends a subscription-INVOICE object, not a subscription.
        // obj (payload.data.attributes) has no variant_id, renews_at, or portal URLs.
        // Subscription details were already set correctly by subscription_created/updated.
        // We ONLY reset quotas and set status to active here.
        const existingUser = await User.findById(userId).select("renewsAt").lean();
        const nextMonth = existingUser?.renewsAt || null;

        const newQuotas = {
          "quotas.video.count": 0,
          "quotas.video.resetDate": nextMonth,
          "quotas.flashcard.count": 0,
          "quotas.flashcard.resetDate": nextMonth,
          "quotas.quiz.count": 0,
          "quotas.quiz.resetDate": nextMonth,
          "quotas.voiceOverview.count": 0,
          "quotas.voiceOverview.resetDate": nextMonth,
          "quotas.document.count": 0,
          "quotas.document.resetDate": nextMonth,
        };

        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: "active",
          ...newQuotas,
        });
        break;

      default:
        console.log(`[Webhook] Unhandled event: ${eventName}`);
    }

    // Record processed event
    await WebhookEventLS.create({ eventId, eventName });

    res.status(200).send("Webhook processed");
  } catch (error) {
    next(error);
  }
};
