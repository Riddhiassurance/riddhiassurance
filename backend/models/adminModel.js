import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    recoveryCode: { type: String, default: null },
    recoveryCodeExpires: { type: Date, default: null }
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;