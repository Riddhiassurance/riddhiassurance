import mongoose from "mongoose";

const advisorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    image: { type: String, default: null },
    
    // Professional Information
    specialization: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, default: '' },
    
    // Availability
    available: { type: Boolean, default: true },
    availableSlots: { type: Object, default: {} },
    
    // Fees/Commission
    consultationFee: { type: Number, required: true },
    
    // Address
    address: { type: Object, required: true, default: { line1: '', line2: '', city: '', state: '', zip: '' } },
    
    // Performance Metrics (auto-updated)
    performance: {
        totalLeadsAssigned: { type: Number, default: 0 },
        leadsContacted: { type: Number, default: 0 },
        leadsConverted: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        averageResponseTime: { type: Number, default: 0 } // in hours
    },
    
    // Slots (keeping for appointment compatibility)
    slots_booked: { type: Object, default: {} },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, { minimize: false, timestamps: true });

const advisorModel = mongoose.models.advisor || mongoose.model("advisor", advisorSchema);
export default advisorModel;
