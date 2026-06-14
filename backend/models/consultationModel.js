import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    advisorId: { type: String, required: true, index: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    advisorData: { type: Object, required: true },
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    
    // Status tracking
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    
    // Consultation details
    type: { type: String, enum: ['appointment', 'consultation', 'follow_up'], default: 'consultation' },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
    notes: String,
    
    // Meeting link (for virtual consultations)
    meetingLink: { type: String, default: null },
    
    // Feedback
    advisorFeedback: String,
    userFeedback: String,
    rating: { type: Number, min: 1, max: 5, default: null },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const consultationModel = mongoose.models.consultation || mongoose.model("consultation", consultationSchema);
export default consultationModel;
