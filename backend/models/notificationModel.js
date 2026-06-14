import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    type: { 
        type: String, 
        enum: ['lead_assigned', 'follow_up_due', 'lead_status_changed', 'lead_reassigned', 'message'],
        required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    referenceType: { type: String, enum: ['lead', 'consultation_request', 'follow_up'] },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

const notificationModel = mongoose.models.notification || mongoose.model("notification", notificationSchema);
export default notificationModel;
