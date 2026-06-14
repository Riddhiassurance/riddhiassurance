import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String, required: true, unique: false },
    password: { type: String, required: true },
    
    // Profile Information
    image: { type: String, default: null },
    age: { type: Number, default: null },
    profession: { type: String, default: '' },
    address: { type: Object, default: { line1: '', line2: '' } },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
    dob: { type: Date, default: null },
    
    // Email Verification
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    
    // Account Security
    accountLocked: { type: Boolean, default: false },
    lockedUntil: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    disabled: { type: Boolean, default: false, index: true },
    
    // Password Security
    passwordHistory: [
        {
            hash: String,
            createdAt: { type: Date, default: Date.now }
        }
    ],
    lastPasswordChange: { type: Date, default: Date.now },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    
    // Role Management
    role: { type: String, enum: ['user', 'advisor', 'admin'], default: 'user' },
    advisorAccess: { type: Boolean, default: false },
    advisorAccessGrantedAt: { type: Date, default: null },
    advisorAccessRevokedAt: { type: Date, default: null },
    refreshTokens: [
        {
            tokenHash: String,
            createdAt: { type: Date, default: Date.now },
            expiresAt: Date,
            userAgent: String,
            ip: String
        }
    ],
    
    // Preferences
    preferences: {
        notifications: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: false }
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: null }
}, { timestamps: true });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
