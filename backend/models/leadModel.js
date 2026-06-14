import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
    consultationRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'consultation_request', required: true },
    advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    
    // Lead Information (from consultation request)
    name: String,
    phone: String,
    email: String,
    age: Number,
    workProfile: String,
    
    // Lead Status & Priority
    status: { type: String, enum: ['new', 'contacted', 'follow_up_required', 'interested', 'not_interested', 'converted', 'closed'], default: 'new' },
    priority: { type: String, enum: ['hot', 'warm', 'cold'], default: 'warm' },
    
    // Lead Source
    source: { type: String, enum: ['website', 'phone', 'referral', 'campaign'], default: 'website' },
    
    // Conversion Information
    converted: { type: Boolean, default: false },
    conversionDate: { type: Date, default: null },
    productInterested: String,
    policyType: String,
    premiumAmount: Number,
    
    // Communication Tracking
    communications: [
        {
            type: { type: String, enum: ['call', 'whatsapp', 'email', 'meeting'], required: true },
            status: { type: String, enum: ['attempted', 'connected', 'sent', 'scheduled', 'completed'], required: true },
            timestamp: { type: Date, default: Date.now },
            notes: String
        }
    ],
    
    // Notes
    notes: [
        {
            content: String,
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        }
    ],
    
    // Follow-up
    nextFollowUpDate: { type: Date, default: null },
    nextFollowUpNote: String,
    
    // Timestamps
    assignedAt: { type: Date, default: Date.now },
    lastContactDate: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const leadModel = mongoose.models.lead || mongoose.model("lead", leadSchema);
export default leadModel;
