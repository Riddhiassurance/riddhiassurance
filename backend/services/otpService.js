import bcrypt from 'bcrypt';
import otpModel from '../models/otpModel.js';

class OTPService {
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async hashOTP(otp) {
        return await bcrypt.hash(otp, 12);
    }

    async verifyOTP(otp, hash) {
        return await bcrypt.compare(otp, hash);
    }

    async storeOTP(identifier, otp, purpose, phone = null, metadata = {}) {
        const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
        const otpHash = await this.hashOTP(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await otpModel.deleteMany({ identifier: normalizedIdentifier, purpose, verified: false });

        const storedOTP = new otpModel({
            email: metadata.email || normalizedIdentifier,
            phone,
            identifier: normalizedIdentifier,
            otpHash,
            purpose,
            expiresAt,
            attempts: 0,
            verified: false,
            metadata,
            lockedUntil: null
        });

        await storedOTP.save();
        return storedOTP;
    }

    async getOTP(identifier, purpose) {
        return await otpModel.findOne({ identifier, purpose, verified: false }).sort({ createdAt: -1 });
    }

    async confirmOTP(identifier, otp, purpose) {
        const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
        const normalizedOtp = String(otp || '').trim();

        const storedOTP = await this.getOTP(normalizedIdentifier, purpose);

        if (!storedOTP) {
            return { success: false, message: 'OTP not found or already verified (request a new OTP).' };
        }

        if (new Date() > storedOTP.expiresAt) {
            await otpModel.deleteOne({ _id: storedOTP._id });
            return { success: false, message: 'OTP has expired (request a new OTP).' };
        }

        if (storedOTP.lockedUntil && new Date() < storedOTP.lockedUntil) {
            const remaining = Math.ceil((storedOTP.lockedUntil - new Date()) / 60000);
            return { success: false, message: `Too many failed attempts. Try again in ${remaining} minute(s).` };
        }

        if (storedOTP.attempts >= 5) {
            storedOTP.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            await storedOTP.save();
            return { success: false, message: 'Maximum OTP verification attempts exceeded (try again after 30 minutes).' };
        }

        const isValid = await this.verifyOTP(normalizedOtp, storedOTP.otpHash);

        if (!isValid) {
            storedOTP.attempts += 1;
            if (storedOTP.attempts >= 5) {
                storedOTP.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            }
            await storedOTP.save();
            return {
                success: false,
                message: 'Invalid OTP. Please check and try again.',
                attempts: storedOTP.attempts,
                lockoutMinutes: storedOTP.attempts >= 5 ? 30 : 0
            };
        }

        // Mark as verified instead of deleting: registration/password-reset flows
        // look up the verified record afterwards to read metadata. The TTL index on
        // expiresAt auto-removes the record, and storeOTP/resetPassword clean up too.
        storedOTP.verified = true;
        await storedOTP.save();

        return { success: true, message: 'OTP verified successfully' };
    }

    async checkDailyOTPLimit(identifier, purpose = null) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const filter = {
            identifier,
            createdAt: { $gte: startOfDay }
        };
        if (purpose) filter.purpose = purpose;

        const otpCount = await otpModel.countDocuments(filter);
        return otpCount;
    }

    async checkHourlyOTPLimit(identifier, purpose = null, maxPerHour = 3) {
        const startOfHour = new Date();
        startOfHour.setMinutes(0, 0, 0);

        const filter = {
            identifier,
            createdAt: { $gte: startOfHour }
        };
        if (purpose) filter.purpose = purpose;

        const count = await otpModel.countDocuments(filter);
        return { count, limited: count >= maxPerHour };
    }

    async storeDummyOTP(identifier, purpose) {
        const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
        await otpModel.deleteMany({ identifier: normalizedIdentifier, purpose, verified: false });

        const storedOTP = new otpModel({
            email: normalizedIdentifier,
            identifier: normalizedIdentifier,
            otpHash: await this.hashOTP('000000'),
            purpose,
            expiresAt: new Date(Date.now() + 60 * 1000),
            attempts: 0,
            verified: false,
            metadata: {}
        });
        await storedOTP.save();
    }

    async cleanupExpiredOTPs() {
        await otpModel.deleteMany({
            $or: [
                { expiresAt: { $lt: new Date() } },
                { lockedUntil: { $lt: new Date() }, attempts: { $gte: 5 } }
            ]
        });
    }
}

export default new OTPService();
