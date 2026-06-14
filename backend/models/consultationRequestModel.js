import mongoose from "mongoose";

const consultationRequestSchema = new mongoose.Schema({
    name: { type: String, required: true, minlength: 2 },
    email: { type: String, default: null },
    phone: { type: String, required: true, unique: false },
    age: { type: Number, required: true, min: 18, max: 100 },
    workProfile: { type: String, required: true, minlength: 2 },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
    services: [{ type: String }],
    preferredDate: { type: Date, default: null },
    preferredTime: { type: String, default: null },
    status: { type: String, enum: ['new', 'contacted', 'follow_up_required', 'converted', 'closed', 'pending', 'in_progress', 'completed', 'cancelled'], default: 'new' },
    priority: { type: String, enum: ['hot', 'warm', 'cold'], default: 'warm' },
    assignedAdvisor: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
    notes: [
        {
            content: String,
            addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
            addedAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const consultationRequestModel = mongoose.models.consultation_request || 
    mongoose.model("consultation_request", consultationRequestSchema);
    
export default consultationRequestModel;
