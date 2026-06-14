import mongoose from "mongoose";

const securityLogsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null, index: true },
    email: { type: String, default: null, index: true },
    action: { 
        type: String, 
        enum: ['registration_requested', 'registration_success', 'registration_failed', 'login_success', 'login_failed', 'logout', 'logout_all', 'otp_requested', 'otp_verified', 'otp_failed', 'password_reset', 'password_reset_requested', 'password_changed', 'profile_updated', 'account_locked', 'account_unlocked', 'admin_action'],
        required: true,
        index: true
    },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    deviceInfo: {
        os: String,
        browser: String,
        platform: String
    },
    status: { type: String, enum: ['success', 'failed'], required: true },
    reason: { type: String, default: null },
    additionalData: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true, expire: 2592000 } // 30 days TTL
}, { timestamps: true });

const securityLogsModel = mongoose.models.security_logs || mongoose.model("security_logs", securityLogsSchema);
export default securityLogsModel;
