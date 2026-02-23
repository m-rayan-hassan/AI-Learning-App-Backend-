import User from '../models/User.model.js';
import { paddle } from "../utils/paddle.js";
import { EventName } from '@paddle/paddle-node-sdk';

// ─── Plan → Price ID Mapping ────────────────────────────────────────
const PLANS = {
  plus: process.env.PADDLE_PRICE_ID_PLUS,
  pro: process.env.PADDLE_PRICE_ID_PRO,
  premium: process.env.PADDLE_PRICE_ID_PREMIUM
};

const getPlanFromPriceId = (priceId) => {
  if (priceId === process.env.PADDLE_PRICE_ID_PLUS) return 'plus';
  if (priceId === process.env.PADDLE_PRICE_ID_PRO) return 'pro';
  if (priceId === process.env.PADDLE_PRICE_ID_PREMIUM) return 'premium';
  return 'free';
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/payments/subscription
// ─────────────────────────────────────────────────────────────────────
export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'planType subscriptionStatus subscriptionEndDate paddleSubscriptionId paddleCustomerId'
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({
      success: true,
      data: {
        planType: user.planType,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate,
        hasActiveSubscription: user.planType !== 'free' && user.subscriptionStatus === 'active',
        paddleScheduledChange: user.paddleScheduledChange
      }
    });
  } catch (error) {
    console.error("getSubscription error:", error);
    return res.status(500).json({ success: false, message: "Failed to get subscription info" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/payments/subscribe
// For FREE users  → returns { action:'checkout', priceId } so frontend opens Paddle Checkout
// For PAID users  → returns { action:'preview_upgrade' } so frontend calls /preview-upgrade
// ─────────────────────────────────────────────────────────────────────
export const subscribe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { targetPlan } = req.body;
    const newPriceId = PLANS[targetPlan];
    if (!newPriceId) return res.status(400).json({ success: false, message: "Invalid plan" });

    // Already on this plan
    if (user.planType === targetPlan) {
      return res.status(400).json({ success: false, message: "You are already on this plan" });
    }

    // Prevent downgrades
    const planRanks = { free: 0, plus: 1, pro: 2, premium: 3 };
    const currentRank = planRanks[user.planType] || 0;
    const targetRank = planRanks[targetPlan] || 0;

    if (targetRank < currentRank) {
      return res.status(400).json({ 
        success: false, 
        message: "Downgrading subscriptions is not currently supported." 
      });
    }

    // PAID user → tell frontend to call preview-upgrade next
    if (user.paddleSubscriptionId && user.planType !== 'free') {
      return res.json({ success: true, action: 'preview_upgrade', targetPlan });
    }

    // FREE user → return priceId for Paddle Checkout overlay
    return res.json({
      success: true,
      action: 'checkout',
      priceId: newPriceId,
      userEmail: user.email,
    });
  } catch (error) {
    console.error("subscribe error:", error);
    return res.status(500).json({ success: false, message: "Subscription request failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/payments/preview-upgrade
// Uses Paddle's subscriptions.previewUpdate() to calculate the prorated
// charge WITHOUT actually applying any changes.
// Returns: updateSummary.charge, updateSummary.credit, immediateTransaction totals
// ─────────────────────────────────────────────────────────────────────
export const previewUpgrade = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.paddleSubscriptionId) {
      return res.status(400).json({ success: false, message: "No active subscription" });
    }

    const { targetPlan } = req.body;
    const newPriceId = PLANS[targetPlan];
    if (!newPriceId) return res.status(400).json({ success: false, message: "Invalid plan" });

    const preview = await paddle.subscriptions.previewUpdate(user.paddleSubscriptionId, {
      items: [{ priceId: newPriceId, quantity: 1 }],
      prorationBillingMode: 'prorated_immediately',
    });

    // updateSummary has .credit (Money) and .charge (Money)
    // Money = { amount: "500", currencyCode: "USD" }
    const summary = preview.updateSummary;
    // immediateTransaction.details.totals has grandTotal, total, credit, currencyCode
    const totals = preview.immediateTransaction?.details?.totals;

    return res.json({
      success: true,
      targetPlan,
      currentPlan: user.planType,
      currencyCode: preview.currencyCode || totals?.currencyCode || 'USD',
      updateSummary: summary ? {
        credit: summary.credit?.amount || '0',
        charge: summary.charge?.amount || '0',
        creditCurrency: summary.credit?.currencyCode,
        chargeCurrency: summary.charge?.currencyCode,
      } : null,
      immediateTransaction: totals ? {
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        credit: totals.credit,
        grandTotal: totals.grandTotal,
        currencyCode: totals.currencyCode,
      } : null,
    });
  } catch (error) {
    console.error("previewUpgrade error:", error);
    return res.status(500).json({ success: false, message: error.message || "Preview failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/payments/confirm-upgrade
// Actually applies the subscription update after the user confirms.
// ─────────────────────────────────────────────────────────────────────
export const confirmUpgrade = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.paddleSubscriptionId) {
      return res.status(400).json({ success: false, message: "No active subscription" });
    }

    const { targetPlan } = req.body;
    const newPriceId = PLANS[targetPlan];
    if (!newPriceId) return res.status(400).json({ success: false, message: "Invalid plan" });

    await paddle.subscriptions.update(user.paddleSubscriptionId, {
      items: [{ priceId: newPriceId, quantity: 1 }],
      prorationBillingMode: 'prorated_immediately',
    });

    // Update DB immediately (webhook will also confirm)
    user.planType = targetPlan;
    await user.save();

    console.log(`[Upgrade] User ${user._id} → ${targetPlan}`);
    return res.json({
      success: true,
      message: `Successfully upgraded to ${targetPlan}`,
      planType: targetPlan,
    });
  } catch (error) {
    console.error("confirmUpgrade error:", error);
    return res.status(500).json({ success: false, message: error.message || "Upgrade failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/payments/cancel
// Cancels at end of billing period. User keeps access until then.
// ─────────────────────────────────────────────────────────────────────
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.paddleSubscriptionId) {
      return res.status(400).json({ success: false, message: "No active subscription to cancel" });
    }

    try {
      await paddle.subscriptions.cancel(user.paddleSubscriptionId, {
        effectiveFrom: 'next_billing_period',
      });
    } catch (paddleErr) {
      console.error("Paddle cancel API error:", paddleErr);
      // If already canceled on Paddle's side, just update our DB
      const msg = paddleErr?.message || '';
      if (!msg.includes('already') && !msg.includes('canceled')) {
        return res.status(400).json({
          success: false,
          message: "Paddle could not cancel: " + msg,
        });
      }
    }

    user.subscriptionStatus = 'canceled';
    user.paddleScheduledChange = { action: 'cancel' };
    await user.save();

    return res.json({
      success: true,
      message: "Your subscription will be canceled at the end of your billing period. You'll keep access until then.",
      subscriptionEndDate: user.subscriptionEndDate,
    });
  } catch (error) {
    console.error("cancelSubscription error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel subscription" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// POST /webhook  — Paddle Webhook Handler
// Must receive RAW body (express.raw applied in index.js before express.json)
// ─────────────────────────────────────────────────────────────────────
export const paymentWebhook = async (req, res) => {
  const signature = req.headers['paddle-signature'];
  const secretKey = process.env.PADDLE_WEBHOOK_SECRET;

  try {
    if (!signature || !secretKey) {
      console.error("Webhook: missing signature or secret");
      return res.status(400).send("Missing signature or secret");
    }

    // express.raw gives Buffer → SDK needs string
    const rawBody = typeof req.body === 'string' ? req.body : req.body.toString('utf-8');
    const eventData = await paddle.webhooks.unmarshal(rawBody, secretKey, signature);
    const { data, eventType } = eventData;

    console.log(`[Paddle Webhook] ${eventType}`);

    switch (eventType) {

      case EventName.SubscriptionActivated: {
        const userId = data.customData?.userId;
        if (!userId) break;
        const priceId = data.items?.[0]?.price?.id;
        await User.findByIdAndUpdate(userId, {
          planType: getPlanFromPriceId(priceId),
          subscriptionStatus: 'active',
          paddleCustomerId: data.customerId,
          paddleSubscriptionId: data.id,
          subscriptionStartDate: data.startedAt ? new Date(data.startedAt) : new Date(),
          subscriptionEndDate: data.currentBillingPeriod?.endsAt ? new Date(data.currentBillingPeriod.endsAt) : null,
          paddleNextBilledAt: data.nextBilledAt ? new Date(data.nextBilledAt) : null,
        });
        console.log(`  → User ${userId} activated: ${getPlanFromPriceId(priceId)}`);
        break;
      }

      case EventName.SubscriptionUpdated: {
        const userId = data.customData?.userId;
        if (!userId) break;
        const priceId = data.items?.[0]?.price?.id;
        const fields = {
          planType: getPlanFromPriceId(priceId),
          subscriptionStatus: data.status || 'active',
          paddleCustomerId: data.customerId,
          paddleSubscriptionId: data.id,
          subscriptionEndDate: data.currentBillingPeriod?.endsAt ? new Date(data.currentBillingPeriod.endsAt) : null,
          paddleNextBilledAt: data.nextBilledAt ? new Date(data.nextBilledAt) : null,
        };
        if (data.scheduledChange) {
          fields.paddleScheduledChange = {
            action: data.scheduledChange.action,
            effectiveAt: data.scheduledChange.effectiveAt,
          };
        }
        await User.findByIdAndUpdate(userId, fields);
        console.log(`  → User ${userId} updated: ${fields.planType} (${fields.subscriptionStatus})`);
        break;
      }

      case EventName.TransactionCompleted: {
        const userId = data.customData?.userId;
        if (!userId) break;
        const priceId = data.details?.lineItems?.[0]?.priceId || data.items?.[0]?.price?.id;
        await User.findByIdAndUpdate(userId, {
          planType: getPlanFromPriceId(priceId),
          subscriptionStatus: 'active',
          paddleCustomerId: data.customerId,
          paddleSubscriptionId: data.subscriptionId,
          lastPaymentDate: new Date(),
          lastPaymentAmount: data.details?.totals?.total,
          lastPaymentCurrency: data.currencyCode,
        });
        console.log(`  → User ${userId} transaction completed: ${getPlanFromPriceId(priceId)}`);
        break;
      }

      case EventName.SubscriptionCanceled: {
        const userId = data.customData?.userId;
        if (!userId) break;
        await User.findByIdAndUpdate(userId, {
          planType: 'free',
          subscriptionStatus: 'canceled',
          paddleSubscriptionId: null,
          paddleScheduledChange: null,
        });
        console.log(`  → User ${userId} canceled`);
        break;
      }

      case EventName.SubscriptionPastDue: {
        const userId = data.customData?.userId;
        if (!userId) break;
        await User.findByIdAndUpdate(userId, { subscriptionStatus: 'past_due' });
        console.log(`  → User ${userId} past due`);
        break;
      }

      default:
        console.log(`  → Unhandled event: ${eventType}`);
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(400).send("Webhook Error");
  }
};
