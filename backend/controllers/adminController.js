import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import jwtService from '../services/jwtService.js';
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
import consultationRequestModel from "../models/consultationRequestModel.js";
import leadModel from "../models/leadModel.js";
import notificationModel from "../models/notificationModel.js";
import Admin from "../models/adminModel.js";
import { logSecurityEvent } from "../middleware/authMiddleware.js";
import { verifyAdminPassword } from "../middleware/authAdmin.js";
import { validateSchema, registerValidation } from '../services/validationService.js';
import emailService from '../services/emailService.js';

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MAX_FAILED_ATTEMPTS = 3;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const generateRecoveryCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required" });
        }

        const adminEmail = process.env.ADMIN_EMAIL;

        if (String(email).toLowerCase().trim() !== String(adminEmail).toLowerCase().trim()) {
            return res.status(401).json({ success: false, message: "Wrong email or password" });
        }

        let admin = await Admin.findOne({ email: adminEmail });
        if (!admin) {
            admin = await Admin.create({ email: adminEmail });
        }

        // Check if account is locked
        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
            const remainingMs = admin.lockedUntil.getTime() - Date.now();
            const remainingMin = Math.ceil(remainingMs / 60000);
            return res.status(429).json({
                success: false,
                message: `Account locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`,
                locked: true,
                lockedUntil: admin.lockedUntil
            });
        }

        const valid = await verifyAdminPassword(String(password));
        if (!valid) {
            admin.failedAttempts = (admin.failedAttempts || 0) + 1;

            if (admin.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                admin.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);

                // Generate and send recovery code
                const recoveryCode = generateRecoveryCode();
                admin.recoveryCode = recoveryCode;
                admin.recoveryCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

                await admin.save();

                await emailService.sendOTPEmail(adminEmail, recoveryCode, 'login');
                await logSecurityEvent(admin._id, adminEmail, 'login_locked', 'warning', 'Admin account locked after 3 failed attempts. Recovery code sent.', req);

                return res.status(429).json({
                    success: false,
                    message: 'Too many failed attempts. Account locked for 15 minutes. A recovery code has been sent to the admin email.',
                    locked: true,
                    lockedUntil: admin.lockedUntil,
                    recoverySent: true
                });
            }

            await admin.save();
            const remaining = MAX_FAILED_ATTEMPTS - admin.failedAttempts;
            return res.status(401).json({
                success: false,
                message: `Invalid credentials. ${remaining} attempt(s) remaining.`
            });
        }

        // Successful login - reset attempts
        admin.failedAttempts = 0;
        admin.lockedUntil = null;
        admin.recoveryCode = null;
        admin.recoveryCodeExpires = null;
        admin.lastLogin = new Date();
        await admin.save();

        const token = jwtService.generateAdminToken(admin._id, adminEmail);
        await logSecurityEvent(admin._id, adminEmail, 'login_success', 'success', 'Admin login', req);
        res.json({ success: true, token, role: 'admin' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Login failed" });
    }
};

const loginAdminWithRecoveryCode = async (req, res) => {
    try {
        const { email, recoveryCode } = req.body;
        if (!email || !recoveryCode) {
            return res.status(400).json({ success: false, message: "Email and recovery code required" });
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (String(email).toLowerCase().trim() !== String(adminEmail).toLowerCase().trim()) {
            return res.status(401).json({ success: false, message: "Wrong email or password" });
        }

        const admin = await Admin.findOne({ email: adminEmail });
        if (!admin || !admin.recoveryCode || !admin.recoveryCodeExpires) {
            return res.status(400).json({ success: false, message: "No recovery code requested. Please try logging in first." });
        }

        if (admin.recoveryCodeExpires < new Date()) {
            admin.recoveryCode = null;
            admin.recoveryCodeExpires = null;
            await admin.save();
            return res.status(410).json({ success: false, message: "Recovery code expired. Request a new one by attempting login." });
        }

        if (String(recoveryCode).trim().toUpperCase() !== String(admin.recoveryCode).trim().toUpperCase()) {
            return res.status(401).json({ success: false, message: "Invalid recovery code" });
        }

        // Success - reset everything
        admin.failedAttempts = 0;
        admin.lockedUntil = null;
        admin.recoveryCode = null;
        admin.recoveryCodeExpires = null;
        admin.lastLogin = new Date();
        await admin.save();

        const token = jwtService.generateAdminToken(admin._id, adminEmail);
        await logSecurityEvent(admin._id, adminEmail, 'login_success', 'success', 'Admin login via recovery code', req);
        res.json({ success: true, token, role: 'admin', message: 'Login successful via recovery code' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Recovery login failed" });
    }
};

const appointmentsAdmin = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [appointments, total] = await Promise.all([
            appointmentModel.find({}).sort({ date: -1 }).skip(skip).limit(limit),
            appointmentModel.countDocuments({})
        ]);

        res.json({ success: true, appointments, pagination: { total, page, pages: Math.ceil(total / limit) } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
    }
};

const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        if (!appointmentId || !validator.isMongoId(appointmentId)) {
            return res.status(400).json({ success: false, message: "Valid appointment ID required" });
        }
        const appointment = await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
        if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
        await logSecurityEvent(req.user?.userId, req.user?.email, 'admin_action', 'success', 'Appointment cancelled', req);
        res.json({ success: true, message: 'Appointment Cancelled' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
    }
};

const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;

        if (!name || !email || !password || !speciality || !experience || !fees || !address) {
            return res.status(400).json({ success: false, message: "Missing Details" });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
            return res.status(400).json({ success: false, message: "Password must be 8+ chars with uppercase, lowercase, and number" });
        }

        const existing = await doctorModel.findOne({ email });
        if (existing) return res.status(409).json({ success: false, message: "Email already registered" });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        let imageUrl = null;
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }

        let parsedAddress;
        try { parsedAddress = typeof address === 'string' ? JSON.parse(address) : address; }
        catch { return res.status(400).json({ success: false, message: "Invalid address format" }); }

        const doctorData = {
            name: String(name).trim(),
            email: String(email).toLowerCase().trim(),
            image: imageUrl,
            password: hashedPassword,
            speciality: String(speciality).trim(),
            degree: String(degree).trim(),
            experience: String(experience).trim(),
            about: String(about).trim(),
            fees: Number(fees),
            address: parsedAddress,
            date: Date.now()
        };

        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();
        await logSecurityEvent(req.user?.userId, req.user?.email, 'admin_action', 'success', 'Doctor added: ' + email, req);
        res.json({ success: true, message: 'Service Added Successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to add service' });
    }
};

const allDoctors = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [doctors, total] = await Promise.all([
            doctorModel.find({}).select('-password').sort({ date: -1 }).skip(skip).limit(limit),
            doctorModel.countDocuments({})
        ]);
        res.json({ success: true, doctors, pagination: { total, page, pages: Math.ceil(total / limit) } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to fetch services' });
    }
};

const removeDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId || !validator.isMongoId(docId)) {
            return res.status(400).json({ success: false, message: "Valid doctor ID required" });
        }
        const doctor = await doctorModel.findByIdAndDelete(docId);
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        await logSecurityEvent(req.user?.userId, req.user?.email, 'admin_action', 'success', 'Doctor removed: ' + docId, req);
        res.json({ success: true, message: 'Service Removed Successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to remove service' });
    }
};

const adminDashboard = async (req, res) => {
    try {
        const [doctors, users, appointments, consultationRequests, leadCounts] = await Promise.all([
            doctorModel.countDocuments(),
            userModel.countDocuments(),
            appointmentModel.countDocuments(),
            consultationRequestModel.countDocuments(),
            consultationRequestModel.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        const [latestConsultationRequests, latestAppointments] = await Promise.all([
            consultationRequestModel.find({}).sort({ createdAt: -1 }).limit(5),
            appointmentModel.find({}).sort({ date: -1 }).limit(5)
        ]);

        const dashData = {
            doctors,
            appointments,
            patients: users,
            consultationRequests,
            advisors: await userModel.countDocuments({ advisorAccess: true }),
            leadCounts: leadCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
            latestConsultationRequests,
            latestAppointments
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const { search = '' } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = {};
        if (search && search.trim()) {
            const escaped = escapeRegex(search.trim());
            filter.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } },
                { phone: { $regex: escaped, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            userModel.find(filter)
                .select('-password -passwordHistory -refreshTokens -passwordResetToken -passwordResetExpires')
                .sort({ createdAt: -1 }).skip(skip).limit(limit),
            userModel.countDocuments(filter)
        ]);

        res.json({ success: true, users, pagination: { total, page, pages: Math.ceil(total / limit) } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

const setUserDisabled = async (req, res) => {
    try {
        const { userId, disabled } = req.body;
        if (!userId || !validator.isMongoId(userId)) {
            return res.status(400).json({ success: false, message: "Valid user ID required" });
        }

        if (userId === req.user?.userId) {
            return res.status(403).json({ success: false, message: 'Cannot disable your own account' });
        }

        const user = await userModel.findByIdAndUpdate(userId, { disabled: Boolean(disabled) }, { new: true })
            .select('-password -passwordHistory -refreshTokens');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await logSecurityEvent(user._id, user.email, 'admin_action', 'success', disabled ? 'User disabled' : 'User enabled', req);
        res.json({ success: true, message: disabled ? 'User disabled' : 'User enabled', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
};

const setAdvisorAccess = async (req, res) => {
    try {
        const { userId, advisorAccess } = req.body;
        if (!userId || !validator.isMongoId(userId)) {
            return res.status(400).json({ success: false, message: "Valid user ID required" });
        }
        const enabled = Boolean(advisorAccess);
        const user = await userModel.findByIdAndUpdate(userId, {
            advisorAccess: enabled,
            role: enabled ? 'advisor' : 'user',
            advisorAccessGrantedAt: enabled ? new Date() : null,
            advisorAccessRevokedAt: enabled ? null : new Date()
        }, { new: true }).select('-password -passwordHistory -refreshTokens');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await logSecurityEvent(user._id, user.email, 'admin_action', 'success', enabled ? 'Advisor access granted' : 'Advisor access revoked', req);
        res.json({ success: true, message: enabled ? 'Advisor access granted' : 'Advisor access revoked', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update advisor access' });
    }
};

const getConsultationRequestsAdmin = async (req, res) => {
    try {
        const { status, priority, search = '' } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search && search.trim()) {
            const escaped = escapeRegex(search.trim());
            filter.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { phone: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } },
                { workProfile: { $regex: escaped, $options: 'i' } }
            ];
        }

        const [consultationRequests, total] = await Promise.all([
            consultationRequestModel.find(filter)
                .populate('assignedAdvisor', 'name email phone')
                .sort({ createdAt: -1 }).skip(skip).limit(limit),
            consultationRequestModel.countDocuments(filter)
        ]);

        res.json({ success: true, consultationRequests, pagination: { total, page, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch consultation requests' });
    }
};

const updateConsultationRequestAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !validator.isMongoId(id)) {
            return res.status(400).json({ success: false, message: "Valid consultation request ID required" });
        }
        const { status, priority, notes } = req.body;
        const validStatuses = ['new', 'contacted', 'follow_up_required', 'converted', 'closed', 'pending', 'in_progress', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const update = {};
        if (status) update.status = status;
        if (priority) update.priority = priority;
        if (notes) {
            update.$push = { notes: { content: String(notes).trim(), addedAt: new Date() } };
        }
        const consultationRequest = await consultationRequestModel.findByIdAndUpdate(id, update, { new: true });
        if (!consultationRequest) return res.status(404).json({ success: false, message: 'Consultation request not found' });
        await logSecurityEvent(req.user?.userId, req.user?.email, 'admin_action', 'success', 'Consultation updated: ' + id, req);
        res.json({ success: true, message: 'Consultation request updated', consultationRequest });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update consultation request' });
    }
};

const deleteConsultationRequestAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !validator.isMongoId(id)) {
            return res.status(400).json({ success: false, message: "Valid consultation request ID required" });
        }
        await leadModel.deleteMany({ consultationRequestId: id });
        const consultationRequest = await consultationRequestModel.findByIdAndDelete(id);
        if (!consultationRequest) return res.status(404).json({ success: false, message: 'Consultation request not found' });
        await logSecurityEvent(req.user?.userId, req.user?.email, 'admin_action', 'success', 'Consultation deleted: ' + id, req);
        res.json({ success: true, message: 'Consultation request deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete consultation request' });
    }
};

const assignConsultationRequest = async (req, res) => {
    try {
        const { requestId, advisorId } = req.body;
        if (!requestId || !validator.isMongoId(requestId) || !advisorId || !validator.isMongoId(advisorId)) {
            return res.status(400).json({ success: false, message: "Valid request and advisor IDs required" });
        }
        const advisor = await userModel.findOne({ _id: advisorId, advisorAccess: true, disabled: false });
        if (!advisor) return res.status(400).json({ success: false, message: 'Advisor access is required before assignment' });
        const request = await consultationRequestModel.findByIdAndUpdate(requestId, { assignedAdvisor: advisor._id }, { new: true });
        if (!request) return res.status(404).json({ success: false, message: 'Consultation request not found' });

        await leadModel.findOneAndUpdate(
            { consultationRequestId: request._id },
            {
                consultationRequestId: request._id,
                advisorId: advisor._id,
                name: request.name,
                phone: request.phone,
                email: request.email,
                age: request.age,
                workProfile: request.workProfile,
                status: request.status,
                priority: request.priority,
                source: 'website'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        await notificationModel.create({
            userId: advisor._id,
            type: 'lead_assigned',
            title: 'New Lead Assigned',
            message: `${request.name} has been assigned to you.`,
            referenceId: request._id,
            referenceType: 'consultation_request'
        });
        await logSecurityEvent(req.user?.userId, req.user?.email, 'admin_action', 'success', 'Consultation assigned: ' + requestId + ' to advisor: ' + advisorId, req);
        res.json({ success: true, message: 'Consultation request assigned', consultationRequest: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to assign consultation request' });
    }
};

const resetUserPassword = async (req, res) => {
    try {
        const { userId, newPassword, adminPassword } = req.body;
        if (!userId || !validator.isMongoId(userId)) {
            return res.status(400).json({ success: false, message: "Valid user ID required" });
        }
        if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: "Password must be 8+ chars with uppercase, lowercase, number, and special character" });
        }
        if (!adminPassword) {
            return res.status(403).json({ success: false, message: "Admin password confirmation required" });
        }
        const validAdmin = await verifyAdminPassword(String(adminPassword));
        if (!validAdmin) {
            return res.status(403).json({ success: false, message: "Admin password confirmation failed" });
        }
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await userModel.findByIdAndUpdate(userId, { password: hashedPassword, refreshTokens: [] });
        await logSecurityEvent(req.user?.userId, req.user?.email, 'admin_action', 'success', 'Password reset for user: ' + userId, req);
        res.json({ success: true, message: 'Password Reset Successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !validator.isMongoId(id)) {
            return res.status(400).json({ success: false, message: "Valid consultation request ID required" });
        }
        const { status } = req.body;
        const validStatuses = ['new', 'contacted', 'follow_up_required', 'converted', 'closed', 'pending', 'in_progress', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }
        const consultationRequest = await consultationRequestModel.findByIdAndUpdate(id, { status }, { new: true });
        if (!consultationRequest) return res.status(404).json({ success: false, message: 'Consultation request not found' });
        await logSecurityEvent(req.user?.userId, req.user?.email, 'admin_action', 'success', 'Status updated for: ' + id + ' to ' + status, req);
        res.json({ success: true, message: 'Status updated successfully', consultationRequest });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};

export {
    loginAdmin,
    loginAdminWithRecoveryCode,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    removeDoctor,
    adminDashboard,
    getAllUsers,
    resetUserPassword,
    setUserDisabled,
    setAdvisorAccess,
    getConsultationRequestsAdmin,
    updateConsultationRequestAdmin,
    deleteConsultationRequestAdmin,
    assignConsultationRequest,
    updateRequestStatus
};
