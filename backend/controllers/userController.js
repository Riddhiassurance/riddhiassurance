import bcrypt from "bcrypt";
import validator from "validator";
import jwtService from '../services/jwtService.js';
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary';
import stripe from "stripe";
import razorpay from 'razorpay';
import { validateSchema, registerValidation, loginValidation } from '../services/validationService.js';
import { sanitizeObject } from '../middleware/securityConfig.js';

const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const registerUser = async (req, res) => {
    try {
        const { valid, value, errors } = validateSchema(registerValidation, req.body);
        if (!valid) return res.status(400).json({ success: false, message: 'Validation failed', errors });

        const email = value.email.toLowerCase();
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(value.password, 12);

        const userData = {
            name: String(value.name).trim(),
            email,
            password: hashedPassword,
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();
        const token = jwtService.generateAccessToken(user._id.toString(), user.email, 'user');

        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { valid, value, errors } = validateSchema(loginValidation, req.body);
        if (!valid) return res.status(400).json({ success: false, message: 'Validation failed', errors });

        const user = await userModel.findOne({ email: value.email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(value.password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwtService.generateAccessToken(user._id.toString(), user.email, 'user');
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId).select('-password');
        if (!userData) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        const updateData = {};
        if (name) updateData.name = String(name).trim();
        if (phone) updateData.phone = String(phone).trim();
        if (dob) updateData.dob = dob;
        if (gender) {
            const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
            if (!validGenders.includes(gender)) {
                return res.status(400).json({ success: false, message: "Invalid gender" });
            }
            updateData.gender = gender;
        }
        if (address) {
            try {
                updateData.address = typeof address === 'string' ? JSON.parse(address) : address;
                if (updateData.address && typeof updateData.address === 'object') {
                    const sanitized = {};
                    for (const [key, val] of Object.entries(updateData.address)) {
                        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
                        sanitized[key] = typeof val === 'string' ? String(val).trim() : val;
                    }
                    updateData.address = sanitized;
                }
            } catch {
                return res.status(400).json({ success: false, message: "Invalid address format" });
            }
        }

        if (Object.keys(updateData).length > 0) {
            await userModel.findByIdAndUpdate(userId, updateData);
        }

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            const imageURL = imageUpload.secure_url;
            await userModel.findByIdAndUpdate(userId, { image: imageURL });
        }

        res.json({ success: true, message: 'Profile Updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Profile update failed' });
    }
};

const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;
        if (!docId || !slotDate || !slotTime) {
            return res.status(400).json({ success: false, message: 'Missing appointment details' });
        }

        const docData = await doctorModel.findById(docId).select("-password");
        if (!docData) return res.status(404).json({ success: false, message: 'Doctor not found' });
        if (!docData.available) {
            return res.status(400).json({ success: false, message: 'Doctor Not Available' });
        }

        const slots_booked = docData.slots_booked || {};
        if (slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime)) {
            return res.status(400).json({ success: false, message: 'Slot Not Available' });
        }

        const userData = await userModel.findById(userId).select("-password");
        if (!userData) return res.status(404).json({ success: false, message: 'User not found' });

        const appointmentData = {
            userId,
            docId,
            userData,
            docData: { ...docData.toObject(), slots_booked: undefined },
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        const updatePath = `slots_booked.${slotDate}`;
        await doctorModel.findByIdAndUpdate(docId, {
            $push: { [updatePath]: slotTime }
        });

        res.json({ success: true, message: 'Appointment Booked' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to book appointment' });
    }
};

const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;
        if (!appointmentId || !validator.isMongoId(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Valid appointment ID required' });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) return res.status(404).json({ success: false, message: 'Appointment not found' });
        if (appointmentData.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized action' });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        const { docId, slotDate, slotTime } = appointmentData;
        await doctorModel.findByIdAndUpdate(docId, {
            $pull: { [`slots_booked.${slotDate}`]: slotTime }
        });

        res.json({ success: true, message: 'Appointment Cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
    }
};

const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId }).sort({ date: -1 });
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
    }
};

const paymentRazorpay = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        if (!appointmentId || !validator.isMongoId(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Valid appointment ID required' });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData || appointmentData.cancelled) {
            return res.status(400).json({ success: false, message: 'Appointment Cancelled or not found' });
        }

        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        };

        const order = await razorpayInstance.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};

const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;
        if (!razorpay_order_id) {
            return res.status(400).json({ success: false, message: 'Order ID required' });
        }

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
            res.json({ success: true, message: "Payment Successful" });
        } else {
            res.json({ success: false, message: 'Payment Failed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

const paymentStripe = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        if (!appointmentId || !validator.isMongoId(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Valid appointment ID required' });
        }

        const { origin } = req.headers;
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData || appointmentData.cancelled) {
            return res.status(400).json({ success: false, message: 'Appointment Cancelled or not found' });
        }

        const currency = (process.env.CURRENCY || 'INR').toLowerCase();
        const line_items = [{
            price_data: {
                currency,
                product_data: { name: "Appointment Fees" },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items,
            mode: 'payment',
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};

const verifyStripe = async (req, res) => {
    try {
        const { appointmentId, success } = req.body;
        if (!appointmentId || !validator.isMongoId(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Valid appointment ID required' });
        }

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
            return res.json({ success: true, message: 'Payment Successful' });
        }

        res.json({ success: false, message: 'Payment Failed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe
};
