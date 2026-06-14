import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    phone: { type: String, default: null },
    identifier: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    purpose: { type: String, enum: ['registration', 'login', 'password_reset'], required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0, max: 5 },
    verified: { type: Boolean, default: false },
    lockedUntil: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
});

const otpModel = mongoose.models.otp || mongoose.model("otp", otpSchema);
export default otpModel;
