import axios from "axios";
import crypto from "crypto";
import type { Response } from "express";
import { sql } from "../utils/db.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const PLAN_NAME = "Hirevix Priority";
const PLAN_AMOUNT = 1000;
const PLAN_CURRENCY = "INR";
const PLAN_DAYS = 30;

const razorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  return { keyId, keySecret };
};

const activateSubscription = async (paymentId: number) => {
  const [payment] = await sql`
    UPDATE payments SET activated_at = NOW(), status = 'captured', updated_at = NOW()
    WHERE payment_id = ${paymentId} AND activated_at IS NULL
    RETURNING user_id
  `;
  if (!payment) return null;

  const [user] = await sql`
    UPDATE users
    SET subscription = GREATEST(COALESCE(subscription, NOW()), NOW()) + INTERVAL '30 days', updated_at = NOW()
    WHERE user_id = ${payment.user_id}
    RETURNING subscription
  `;
  // Existing applications must gain the same priority as applications submitted after purchase.
  await sql`UPDATE applications SET subscribed = TRUE WHERE applicant_id = ${payment.user_id}`;
  await sql`UPDATE payments SET subscription_expires_at = ${user.subscription}, updated_at = NOW() WHERE payment_id = ${paymentId}`;
  return user.subscription as string;
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "jobseeker") return res.status(403).json({ message: "Only job seekers can purchase this plan" });
    if (req.user.subscription && new Date(req.user.subscription).getTime() > Date.now()) {
      return res.status(409).json({ message: "Your subscription is already active" });
    }
    const { keyId, keySecret } = razorpayConfig();
    const receipt = `hv_${req.user.user_id}_${Date.now()}`;
    const { data } = await axios.post("https://api.razorpay.com/v1/orders", {
      amount: PLAN_AMOUNT,
      currency: PLAN_CURRENCY,
      receipt,
      notes: { user_id: String(req.user.user_id), plan: PLAN_NAME, duration_days: String(PLAN_DAYS) },
    }, { auth: { username: keyId, password: keySecret }, timeout: 15000 });

    await sql`
      INSERT INTO payments (user_id, razorpay_order_id, receipt, amount, currency, plan_name, plan_days, status)
      VALUES (${req.user.user_id}, ${data.id}, ${receipt}, ${PLAN_AMOUNT}, ${PLAN_CURRENCY}, ${PLAN_NAME}, ${PLAN_DAYS}, 'created')
    `;
    res.status(201).json({ orderId: data.id, amount: PLAN_AMOUNT, currency: PLAN_CURRENCY, keyId, planName: PLAN_NAME, planDays: PLAN_DAYS });
  } catch (error: unknown) {
    const message = axios.isAxiosError(error) ? error.response?.data?.error?.description || "Unable to create Razorpay order" : error instanceof Error ? error.message : "Unable to create payment order";
    res.status(500).json({ message });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "jobseeker") return res.status(403).json({ message: "Only job seekers can purchase this plan" });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as Record<string, string>;
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((value) => typeof value === "string" && value.length > 0)) return res.status(400).json({ message: "Invalid payment verification data" });
    const [payment] = await sql`SELECT payment_id, status, activated_at FROM payments WHERE razorpay_order_id = ${razorpay_order_id} AND user_id = ${req.user.user_id}`;
    if (!payment) return res.status(404).json({ message: "Payment order was not found" });

    const { keySecret } = razorpayConfig();
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const verified = expectedSignature.length === razorpay_signature.length && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));
    if (!verified) return res.status(400).json({ message: "Payment signature verification failed" });

    await sql`UPDATE payments SET razorpay_payment_id = ${razorpay_payment_id}, razorpay_signature = ${razorpay_signature}, status = 'verified', updated_at = NOW() WHERE payment_id = ${payment.payment_id}`;
    const subscriptionExpiresAt = await activateSubscription(payment.payment_id);
    res.json({ message: "Subscription activated successfully", subscriptionExpiresAt: subscriptionExpiresAt || req.user.subscription, planName: PLAN_NAME, planDays: PLAN_DAYS });
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Unable to verify payment" });
  }
};

export const paymentStatus = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Authentication is required" });
  const [latestPayment] = await sql`SELECT plan_name, amount, currency, status, subscription_expires_at, created_at FROM payments WHERE user_id = ${req.user.user_id} ORDER BY created_at DESC LIMIT 1`;
  res.json({ subscriptionExpiresAt: req.user.subscription, latestPayment: latestPayment || null, planName: PLAN_NAME, amount: PLAN_AMOUNT, currency: PLAN_CURRENCY, planDays: PLAN_DAYS });
};

export const razorpayWebhook = async (req: AuthenticatedRequest, res: Response) => {
  const signature = req.headers["x-razorpay-signature"];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = req.body as Buffer;
  if (!webhookSecret || typeof signature !== "string" || !Buffer.isBuffer(rawBody)) return res.status(400).json({ message: "Invalid webhook request" });
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return res.status(400).json({ message: "Invalid webhook signature" });
  try {
    const event = JSON.parse(rawBody.toString("utf8")) as { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } };
    const orderId = event.payload?.payment?.entity?.order_id;
    if (orderId && (event.event === "payment.captured" || event.event === "order.paid")) {
      const [payment] = await sql`SELECT payment_id FROM payments WHERE razorpay_order_id = ${orderId}`;
      if (payment) await activateSubscription(payment.payment_id);
    }
    if (orderId && event.event === "payment.failed") await sql`UPDATE payments SET status = 'failed', updated_at = NOW() WHERE razorpay_order_id = ${orderId} AND activated_at IS NULL`;
    res.status(200).json({ received: true });
  } catch {
    res.status(400).json({ message: "Unable to process webhook" });
  }
};
