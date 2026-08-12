import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import paymentRoutes from "./routes/payment.js";
import { razorpayWebhook } from "./controllers/payment.js";
import { sql } from "./utils/db.js";

const app = express();
const paymentOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "https://hirevix-careers.vercel.app",
  "https://hirevix-careers-e389tbocm-sandeep-yadav-94s-projects.vercel.app",
  "https://hirevix-careers-p3rsjjf7r-sandeep-yadav-94s-projects.vercel.app",
];
const vercelOriginRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (paymentOrigins.includes(origin) || vercelOriginRegex.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));
app.post("/api/payment/webhook", express.raw({ type: "application/json" }), razorpayWebhook);
app.use(express.json());
app.use("/api/payment", paymentRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/payment/health", (_req, res) => res.json({ status: "ok", service: "payment" }));

async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      payment_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
      razorpay_payment_id VARCHAR(100) UNIQUE,
      razorpay_signature VARCHAR(255),
      receipt VARCHAR(100) NOT NULL UNIQUE,
      amount INTEGER NOT NULL,
      currency VARCHAR(10) NOT NULL,
      plan_name VARCHAR(100) NOT NULL,
      plan_days INTEGER NOT NULL,
      status VARCHAR(30) NOT NULL,
      subscription_expires_at TIMESTAMPTZ,
      activated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS payments_user_id_created_at_idx ON payments (user_id, created_at DESC)`;
}

initializeDatabase().then(() => {
  const port = Number(process.env.PORT || 4004);
  app.listen(port, () => console.log(`Payment service running on http://localhost:${port}`));
}).catch((error) => { console.error("Payment service database initialization failed", error); process.exit(1); });
