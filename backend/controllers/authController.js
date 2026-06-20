import crypto from 'crypto';
import validator from 'validator';
import { v2 as cloudinary } from 'cloudinary';
import userModel from '../models/userModel.js';
import otpModel from '../models/otpModel.js';
import Admin from '../models/adminModel.js';
import emailService from '../services/emailService.js';
import otpService from '../services/otpService.js';
import passwordService from '../services/passwordService.js';
import jwtService from '../services/jwtService.js';
import {
    validateSchema,
    registerValidation,
    loginValidation,
    forgotPasswordStep1Validation,
    resetPasswordValidation,
    changePasswordValidation
} from '../services/validationService.js';
import { logSecurityEvent, getClientInfo } from '../middleware/authMiddleware.js';
import { verifyAdminPassword } from '../middleware/authAdmin.js';
import { cookieOptions, refreshCookieOptions, clearCookieOptions } from '../middleware/securityConfig.js';

const maxOtpPerDay = Number(process.env.MAX_OTP_PER_DAY || 2);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    age: user.age,
    image: user.image,
    role: user.role,
    advisorAccess: user.advisorAccess,
    disabled: user.disabled,
    gender: user.gender,
    address: user.address,
    dob: user.dob,
    profession: user.profession
});

const issueAuthCookies = async (res, req, user) => {
    const { accessToken, refreshToken } = jwtService.generateTokens(user._id, user.email, user.role);
    const { ip, userAgent } = getClientInfo(req);

    user.refreshTokens = [
        ...(user.refreshTokens || []).filter((item) => item.expiresAt && item.expiresAt > new Date()).slice(-4),
        {
            tokenHash: hashToken(refreshToken),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ip,
            userAgent
        }
    ];
    await user.save();

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return accessToken;
};

export const register = async (req, res) => {
    try {
        console.log('[OTP-REG][request] content-type=', req.headers['content-type'],
            '| body keys=', Object.keys(req.body || {}),
            '| hasFile=', Boolean(req.file));
        const { valid, value, errors } = validateSchema(registerValidation, req.body);
        if (!valid) return res.status(400).json({ success: false, message: 'Validation failed', errors });

        const email = value.email.toLowerCase();
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            await logSecurityEvent(null, email, 'registration_failed', 'failed', 'Email already registered', req);
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const otpCount = await otpService.checkDailyOTPLimit(email, 'registration');
        if (otpCount >= maxOtpPerDay) {
            return res.status(429).json({ success: false, message: 'Maximum OTP requests reached for today. Please try again tomorrow.' });
        }

        let imageUrl = null;
        if (req.file) {
            console.log('[OTP-REG][request] uploading image to Cloudinary...');
            const imageUpload = await cloudinary.uploader.upload(req.file.path, {
                resource_type: 'image',
                timeout: 30000
            });
            imageUrl = imageUpload.secure_url;
            console.log('[OTP-REG][request] Cloudinary upload complete');
        }

        const otp = otpService.generateOTP();
        console.log('[OTP-REG][request] identifier(email)=', email, 'purpose=registration');
        await otpService.storeOTP(email, otp, 'registration', value.phone, {
            name: value.name,
            email,
            phone: value.phone,
            passwordHash: await passwordService.hashPassword(value.password),
            gender: value.gender || 'prefer_not_to_say',
            image: imageUrl,
            profession: value.profession || ''
        });
        console.log('[OTP-REG][request] OTP stored, sending email...');
        const emailResult = await emailService.sendOTPEmail(email, otp, 'registration');
        if (!emailResult.success) {
            console.log('[OTP-REG][request] email send FAILED (non-fatal):', emailResult.message);
            console.log('[OTP-REG][request] OTP for', email, 'is:', otp, '(check Render logs to retrieve if email not delivered)');
        } else {
            console.log('[OTP-REG][request] email sent successfully');
        }
        await logSecurityEvent(null, email, 'registration_requested', 'success', null, req);

        return res.status(200).json({ success: true, message: 'OTP sent to your email. Please verify to complete registration.', email });
    } catch (error) {
        console.error('[OTP-REG][request] UNHANDLED ERROR:', error);
        console.error('[OTP-REG][request] error.name:', error.name);
        console.error('[OTP-REG][request] error.message:', error.message);
        if (error.code) console.error('[OTP-REG][request] error.code:', error.code);
        if (error.response?.body) console.error('[OTP-REG][request] cloudinary response:', error.response.body);
        return res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

export const verifyEmailAndRegister = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const lowerEmail = String(email || '').trim().toLowerCase();
        if (!validator.isEmail(lowerEmail) || !/^\d{6}$/.test(String(otp || ''))) {
            return res.status(400).json({ success: false, message: 'Valid email and 6 digit OTP required' });
        }

        console.log('[OTP-REG][verify] identifier(email)=', lowerEmail, 'otp=', otp);
        const otpResult = await otpService.confirmOTP(lowerEmail, otp, 'registration');
        console.log('[OTP-REG][verify] otpResult=', otpResult);

        if (!otpResult.success) {
            await logSecurityEvent(null, lowerEmail, 'otp_failed', 'failed', otpResult.message, req);
            return res.status(400).json({ success: false, message: otpResult.message });
        }

        const otpRecord = await otpModel.findOne({ identifier: lowerEmail, purpose: 'registration', verified: true }).sort({ updatedAt: -1 });
        console.log('[OTP-REG][verify] otpRecord found=', !!otpRecord);
        if (!otpRecord?.metadata?.passwordHash) {
            return res.status(400).json({ success: false, message: 'Registration data expired. Please register again.' });
        }


        const existingUser = await userModel.findOne({ email: lowerEmail });
        if (existingUser) {
            console.log('[OTP-REG][verify] email already registered for', lowerEmail);
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }


        const user = await userModel.create({
            name: otpRecord.metadata.name,
            email: lowerEmail,
            phone: otpRecord.metadata.phone,
            password: otpRecord.metadata.passwordHash,
            gender: otpRecord.metadata.gender || 'prefer_not_to_say',
            image: otpRecord.metadata.image || null,
            profession: otpRecord.metadata.profession || '',
            emailVerified: true,
            passwordHistory: [{ hash: otpRecord.metadata.passwordHash }]
        });

        const token = await issueAuthCookies(res, req, user);
        await logSecurityEvent(user._id, user.email, 'registration_success', 'success', null, req);
        return res.status(201).json({ success: true, message: 'Account created successfully', token, user: publicUser(user) });
    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({ success: false, message: 'Email verification failed' });
    }
};

export const login = async (req, res) => {
    try {
        const { valid, value, errors } = validateSchema(loginValidation, req.body);
        if (!valid) return res.status(400).json({ success: false, message: 'Validation failed', errors });

        const email = value.email.toLowerCase();
        const password = value.password;

        // Admin credentials (single unified login)
        const adminEmail = process.env.ADMIN_EMAIL;

        if (adminEmail && email === String(adminEmail).toLowerCase()) {
            const valid = await verifyAdminPassword(password);
            if (!valid) {
                await logSecurityEvent(null, email, 'login_failed', 'failed', 'Admin invalid password', req);
                return res.status(401).json({ success: false, message: 'Wrong email or password' });
            }
            let admin = await Admin.findOne({ email: adminEmail });
            if (!admin) {
                admin = await Admin.create({ email: adminEmail });
            }
            admin.lastLogin = new Date();
            await admin.save();
            const accessToken = jwtService.generateAdminToken(admin._id, adminEmail);
            res.cookie('accessToken', accessToken, cookieOptions);
            return res.status(200).json({ success: true, message: 'Login successful', token: accessToken, role: 'admin' });
        }

        const user = await userModel.findOne({ email });

        // Always return same error message for wrong credentials regardless of role
        if (!user) {
            await logSecurityEvent(null, email, 'login_failed', 'failed', 'User not found', req);
            return res.status(401).json({ success: false, message: 'Wrong email or password' });
        }

        // Do not reveal disabled/locked status; treat as invalid credentials
        if (user.disabled) return res.status(401).json({ success: false, message: 'Wrong email or password' });
        if (user.accountLocked && user.lockedUntil > new Date()) {
            return res.status(401).json({ success: false, message: 'Wrong email or password' });
        }

        const validPassword = await passwordService.verifyPassword(password, user.password);
        if (!validPassword) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= 5) {
                user.accountLocked = true;
                user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                await logSecurityEvent(user._id, email, 'account_locked', 'success', 'Too many failed login attempts', req);
            }
            await user.save();
            await logSecurityEvent(user._id, email, 'login_failed', 'failed', 'Invalid password', req);
            return res.status(401).json({ success: false, message: 'Wrong email or password' });
        }

        user.failedLoginAttempts = 0;
        user.accountLocked = false;
        user.lockedUntil = null;
        user.lastLogin = new Date();

        const accessToken = await issueAuthCookies(res, req, user);
        await logSecurityEvent(user._id, email, 'login_success', 'success', null, req);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token: accessToken,
            role: user.role,
            user: publicUser(user)
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Login failed' });
    }
};

export const requestOTPLogin = async (req, res) => {
    try {
        const { identifier, emailOrPhone, email } = req.body;
        const id = String(identifier || emailOrPhone || email || '').trim();

        if (!id) return res.status(400).json({ success: false, message: 'Valid identifier required' });

        const isEmail = validator.isEmail(id);
        const isPhone = validator.isMobilePhone(id, 'en-IN');

        if (!isEmail && !isPhone) {
            return res.status(400).json({ success: false, message: 'Valid email or Indian phone number required' });
        }

        const identifierNormalized = isEmail ? id.toLowerCase() : id;

        // Find by either email or phone
        const user = isEmail
            ? await userModel.findOne({ email: identifierNormalized })
            : await userModel.findOne({ phone: identifierNormalized });

        // Never reveal whether an account exists
        if (!user || user.disabled) {
            await otpService.storeDummyOTP(identifierNormalized, 'login');
            const hourLimit = await otpService.checkHourlyOTPLimit(identifierNormalized, 'login', 3);
            if (hourLimit.limited) {
                return res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again later.' });
            }
            return res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.', identifier: identifierNormalized });
        }

        const otpCount = await otpService.checkDailyOTPLimit(identifierNormalized, 'login');
        if (otpCount >= maxOtpPerDay) {
            return res.status(429).json({ success: false, message: 'Maximum OTP requests reached for today. Please try again tomorrow.' });
        }

        const otp = otpService.generateOTP();
        const otpPhone = user.phone; // store phone for email-based OTP too
        await otpService.storeOTP(
            identifierNormalized,
            otp,
            'login',
            otpPhone,
            { userId: user._id, email: user.email }
        );

        await logSecurityEvent(user._id, user.email, 'otp_requested', 'success', null, req);

        if (isEmail) {
            await emailService.sendOTPEmail(user.email, otp, 'login');
        }

        return res.status(200).json({
            success: true,
            message: 'If an account exists, an OTP has been sent.',
            identifier: identifierNormalized
        });
    } catch (error) {
        console.error('OTP request error:', error);
        return res.status(500).json({ success: false, message: 'OTP request failed' });
    }
};

export const verifyOTPLogin = async (req, res) => {
    try {
        const { identifier, emailOrPhone, email, otp } = req.body;
        const id = String(identifier || emailOrPhone || email || '').trim();

        if (!id || !/^\d{6}$/.test(String(otp || ''))) {
            return res.status(400).json({ success: false, message: 'Valid identifier and 6 digit OTP required' });
        }

        const isEmail = validator.isEmail(id);
        const identifierNormalized = isEmail ? id.toLowerCase() : id;

        const otpResult = await otpService.confirmOTP(identifierNormalized, otp, 'login');
        if (!otpResult.success) return res.status(400).json({ success: false, message: otpResult.message });

        const user = isEmail
            ? await userModel.findOne({ email: identifierNormalized })
            : await userModel.findOne({ phone: identifierNormalized });

        // Treat missing/disabled user as invalid OTP flow without leaking
        if (!user || user.disabled) return res.status(401).json({ success: false, message: 'OTP verification failed' });

        user.lastLogin = new Date();
        const accessToken = await issueAuthCookies(res, req, user);
        await logSecurityEvent(user._id, user.email, 'login_success', 'success', 'OTP login', req);

        return res.status(200).json({
            success: true,
            message: 'OTP login successful',
            token: accessToken,
            role: user.role,
            user: publicUser(user)
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({ success: false, message: 'OTP verification failed' });
    }
};

export const requestPasswordResetOTP = async (req, res) => {
    try {
        const { valid, value, errors } = validateSchema(forgotPasswordStep1Validation, req.body);
        if (!valid) return res.status(400).json({ success: false, message: 'Validation failed', errors });

        const identifier = value.emailOrPhone.toLowerCase();

        const hourLimit = await otpService.checkHourlyOTPLimit(identifier, 'password_reset', 3);
        if (hourLimit.limited) {
            return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
        }

        const user = validator.isEmail(identifier)
            ? await userModel.findOne({ email: identifier })
            : await userModel.findOne({ phone: identifier });

        if (!user) {
            await otpService.storeDummyOTP(identifier, 'password_reset');
            return res.status(200).json({ success: true, message: 'If an account exists, a reset OTP has been sent.' });
        }

        const otpCount = await otpService.checkDailyOTPLimit(identifier, 'password_reset');
        if (otpCount >= maxOtpPerDay) {
            return res.status(429).json({ success: false, message: 'Maximum OTP requests reached for today. Please try again tomorrow.' });
        }

        const otp = otpService.generateOTP();
        await otpService.storeOTP(identifier, otp, 'password_reset', user.phone, { userId: user._id, email: user.email });
        await emailService.sendOTPEmail(user.email, otp, 'password_reset');
        await logSecurityEvent(user._id, user.email, 'password_reset_requested', 'success', null, req);

        return res.status(200).json({ success: true, message: 'If an account exists, a reset OTP has been sent.' });
    } catch (error) {
        console.error('Password reset request error:', error);
        return res.status(500).json({ success: false, message: 'Password reset request failed' });
    }
};

export const verifyPasswordResetOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;
        const normalized = String(identifier || '').toLowerCase();
        const otpResult = await otpService.confirmOTP(normalized, otp, 'password_reset');
        if (!otpResult.success) return res.status(400).json({ success: false, message: otpResult.message });
        await logSecurityEvent(null, normalized, 'otp_verified', 'success', 'Password reset OTP verified', req);
        return res.status(200).json({ success: true, message: 'OTP verified. You can now reset your password.' });
    } catch (error) {
        console.error('Password reset OTP verify error:', error);
        return res.status(500).json({ success: false, message: 'OTP verification failed' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { identifier, email, newPassword, confirmPassword } = req.body;
        const normalized = String(identifier || email || '').toLowerCase();
        const { valid, errors } = validateSchema(resetPasswordValidation, {
            email: validator.isEmail(normalized) ? normalized : 'placeholder@example.com',
            newPassword,
            confirmPassword
        });
        if (!valid) return res.status(400).json({ success: false, message: 'Validation failed', errors });

        const otpRecord = await otpModel.findOne({ identifier: normalized, purpose: 'password_reset', verified: true }).sort({ updatedAt: -1 });
        if (!otpRecord) return res.status(403).json({ success: false, message: 'OTP verification required before password reset' });

        const user = await userModel.findById(otpRecord.metadata.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (await passwordService.isPasswordInHistory(newPassword, user.passwordHistory)) {
            return res.status(400).json({ success: false, message: 'You cannot reuse a recent password' });
        }

        const hash = await passwordService.hashPassword(newPassword);
        user.password = hash;
        user.passwordHistory = [{ hash }, ...(user.passwordHistory || [])].slice(0, 5);
        user.lastPasswordChange = new Date();
        user.refreshTokens = [];
        await user.save();
        await otpModel.deleteMany({ identifier: normalized, purpose: 'password_reset' });
        await logSecurityEvent(user._id, user.email, 'password_reset', 'success', null, req);
        return res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({ success: false, message: 'Password reset failed' });
    }
};

export const me = async (req, res) => {
    const user = await userModel.findById(req.user.userId).select('-password -passwordHistory -refreshTokens -passwordResetToken -passwordResetExpires');
    if (!user || user.disabled) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user: publicUser(user) });
};

export const changePassword = async (req, res) => {
    try {
        const { valid, value, errors } = validateSchema(changePasswordValidation, req.body);
        if (!valid) return res.status(400).json({ success: false, message: 'Validation failed', errors });

        const user = await userModel.findById(req.user.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (!(await passwordService.verifyPassword(value.currentPassword, user.password))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        if (await passwordService.isPasswordInHistory(value.newPassword, user.passwordHistory)) {
            return res.status(400).json({ success: false, message: 'You cannot reuse a recent password' });
        }

        const hash = await passwordService.hashPassword(value.newPassword);
        user.password = hash;
        user.passwordHistory = [{ hash }, ...(user.passwordHistory || [])].slice(0, 5);
        user.lastPasswordChange = new Date();
        user.refreshTokens = [];
        await user.save();
        await logSecurityEvent(user._id, user.email, 'password_changed', 'success', null, req);
        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ success: false, message: 'Password change failed' });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken && req.user?.userId && req.user.role !== 'admin') {
            await userModel.findByIdAndUpdate(req.user.userId, { $pull: { refreshTokens: { tokenHash: hashToken(refreshToken) } } });
        }
        res.clearCookie('accessToken', clearCookieOptions);
        res.clearCookie('refreshToken', clearCookieOptions);
        await logSecurityEvent(req.user?.userId, req.user?.email, 'logout', 'success', null, req);
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ success: false, message: 'Logout failed' });
    }
};

export const logoutAll = async (req, res) => {
    if (req.user.role !== 'admin') {
        await userModel.findByIdAndUpdate(req.user.userId, { refreshTokens: [] });
    }
    res.clearCookie('accessToken', clearCookieOptions);
    res.clearCookie('refreshToken', clearCookieOptions);
    await logSecurityEvent(req.user.userId, req.user.email, 'logout_all', 'success', null, req);
    return res.status(200).json({ success: true, message: 'Logged out from all devices' });
};

export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

        const decoded = jwtService.verifyRefreshToken(refreshToken);
        if (!decoded) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

        const user = await userModel.findById(decoded.userId);
        if (!user || user.disabled) return res.status(401).json({ success: false, message: 'User not found' });

        const tokenHash = hashToken(refreshToken);
        const sessionExists = (user.refreshTokens || []).some((item) => item.tokenHash === tokenHash && item.expiresAt > new Date());
        if (!sessionExists) {
            user.refreshTokens = [];
            await user.save();
            return res.status(401).json({ success: false, message: 'Refresh token reuse detected' });
        }

        user.refreshTokens = user.refreshTokens.filter((item) => item.tokenHash !== tokenHash);
        const token = await issueAuthCookies(res, req, user);
        return res.status(200).json({ success: true, message: 'Token refreshed', token });
    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(500).json({ success: false, message: 'Token refresh failed' });
    }
};

export default {
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
};

