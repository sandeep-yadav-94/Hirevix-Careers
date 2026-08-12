import express from 'express';
import registerUser, { loginUser, resendVerificationOtp, verifyEmailOtp } from '../controllers/auth.js';
import uploadFile from '../middleware/multer.js';

const router = express.Router();

router.post("/register", uploadFile, registerUser);
router.post("/verify-email", verifyEmailOtp);
router.post("/resend-verification-otp", resendVerificationOtp);
router.post("/login", loginUser)

export default router;
