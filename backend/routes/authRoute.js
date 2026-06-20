import express from 'express';
import {
    register,
    verifyEmailAndRegister,
    login,
    requestOTPLogin,
    verifyOTPLogin,
    requestPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPassword,
    me,
    changePassword,
    logout,
    logoutAll,
    refreshAccessToken
} from '../controllers/authController.js';
import { authLimiter, otpLimiter, otpPerMinuteLimiter, passwordResetLimiter } from '../middleware/securityConfig.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/register/request-otp', upload.single('profileImage'), authLimiter, register);
router.post('/register/verify', authLimiter, verifyEmailAndRegister);
router.post('/login', authLimiter, login);

/**
 * OTP Login (unified identifier: email OR phone)
 * - Existing legacy routes:
 *   - /otp-login/request
 *   - /otp-login/verify
 * - Required routes:
 *   - /request-otp-login
 *   - /verify-otp-login
 */
router.post('/otp-login/request', otpLimiter, requestOTPLogin);
router.post('/otp-login/verify', authLimiter, verifyOTPLogin);

router.post('/request-otp-login', otpLimiter, requestOTPLogin);
router.post('/verify-otp-login', authLimiter, verifyOTPLogin);
router.post('/forgot-password/request-otp', passwordResetLimiter, otpLimiter, requestPasswordResetOTP);
router.post('/forgot-password/verify-otp', authLimiter, verifyPasswordResetOTP);
router.post('/forgot-password/reset', passwordResetLimiter, resetPassword);
router.get('/me', authMiddleware, me);
router.post('/change-password', authMiddleware, changePassword);
router.post('/logout', authMiddleware, logout);
router.post('/logout-all', authMiddleware, logoutAll);
router.post('/refresh-token', refreshAccessToken);

export default router;
