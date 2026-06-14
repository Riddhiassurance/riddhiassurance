import bcrypt from "bcrypt";
import validator from "validator";
import jwtService from '../services/jwtService.js';
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const user = await doctorModel.findOne({ email: String(email).toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwtService.generateAccessToken(user._id.toString(), user.email, 'doctor');
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId || !validator.isMongoId(docId)) {
            return res.status(400).json({ success: false, message: 'Valid doctor ID required' });
        }

        const appointments = await appointmentModel.find({ docId }).sort({ date: -1 });
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
    }
};

const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        if (!appointmentId || !validator.isMongoId(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Valid appointment ID required' });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) return res.status(404).json({ success: false, message: 'Appointment not found' });
        if (appointmentData.docId !== docId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
        res.json({ success: true, message: 'Appointment Cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
    }
};

const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        if (!appointmentId || !validator.isMongoId(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Valid appointment ID required' });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) return res.status(404).json({ success: false, message: 'Appointment not found' });
        if (appointmentData.docId !== docId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
        res.json({ success: true, message: 'Appointment Completed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to complete appointment' });
    }
};

const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email']);
        res.json({ success: true, doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch services' });
    }
};

const changeAvailablity = async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId || !validator.isMongoId(docId)) {
            return res.status(400).json({ success: false, message: 'Valid doctor ID required' });
        }

        const docData = await doctorModel.findById(docId);
        if (!docData) return res.status(404).json({ success: false, message: 'Doctor not found' });

        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });
        res.json({ success: true, message: 'Availablity Changed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to change availability' });
    }
};

const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId || !validator.isMongoId(docId)) {
            return res.status(400).json({ success: false, message: 'Valid doctor ID required' });
        }

        const profileData = await doctorModel.findById(docId).select('-password');
        if (!profileData) return res.status(404).json({ success: false, message: 'Doctor not found' });

        res.json({ success: true, profileData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};

const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, fees, address, available } = req.body;
        if (!docId || !validator.isMongoId(docId)) {
            return res.status(400).json({ success: false, message: 'Valid doctor ID required' });
        }

        const updateData = {};
        if (fees !== undefined) updateData.fees = Number(fees);
        if (available !== undefined) updateData.available = Boolean(available);
        if (address) {
            try {
                updateData.address = typeof address === 'string' ? JSON.parse(address) : address;
            } catch {
                return res.status(400).json({ success: false, message: 'Invalid address format' });
            }
        }

        await doctorModel.findByIdAndUpdate(docId, updateData);
        res.json({ success: true, message: 'Profile Updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId || !validator.isMongoId(docId)) {
            return res.status(400).json({ success: false, message: 'Valid doctor ID required' });
        }

        const appointments = await appointmentModel.find({ docId });
        let earnings = 0;
        const patients = new Set();

        appointments.forEach((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount;
            }
            if (item.userId) patients.add(item.userId.toString());
        });

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.size,
            latestAppointments: appointments.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
        };

        res.json({ success: true, dashData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
};

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
};
