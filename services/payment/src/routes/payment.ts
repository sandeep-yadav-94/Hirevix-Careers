import express from "express";
import { isAuth } from "../middleware/auth.js";
import { createOrder, paymentStatus, verifyPayment } from "../controllers/payment.js";

const router = express.Router();
router.post("/order", isAuth, createOrder);
router.post("/verify", isAuth, verifyPayment);
router.get("/status", isAuth, paymentStatus);
export default router;
