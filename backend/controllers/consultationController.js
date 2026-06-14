import consultationRequestModel from '../models/consultationRequestModel.js';
import emailService from '../services/emailService.js';
import { validateSchema, consultationRequestValidation } from '../services/validationService.js';
import { logSecurityEvent } from '../middleware/authMiddleware.js';
import userModel from '../models/userModel.js';

export const buildCalendarDateTime = (date, time) => {
  if (!date) return null;
  const d = new Date(date);
  if (time) {
    const [hours, minutes] = time.split(':');
    d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    d.setHours(10, 0, 0, 0);
  }
  return d.toISOString();
};

// Submit consultation request (Book a call)
export const submitConsultationRequest = async (req, res) => {
    try {
        const { valid, value, errors } = validateSchema(consultationRequestValidation, req.body);
        
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const { name, email, phone, age, workProfile, gender, services, preferredDate, preferredTime } = value;

        // Create consultation request
        const consultationRequest = new consultationRequestModel({
            name,
            email: email || null,
            phone,
            age,
            workProfile,
            gender: gender || 'prefer_not_to_say',
            services: services || [],
            preferredDate: preferredDate || null,
            preferredTime: preferredTime || null,
            status: 'new',
            priority: 'warm'
        });

        await consultationRequest.save();

        // Send confirmation email if email provided
        if (email) {
            await emailService.sendConsultationConfirmationEmail(email, name, {
                name,
                phone,
                age,
                workProfile
            });
        }

        // Send calendar notification emails for Book a Call bookings with date/time
        if (preferredDate && preferredTime) {
            const combinedDateTime = buildCalendarDateTime(preferredDate, preferredTime);

            const calendarLinks = emailService.generateCalendarLinks({
                title: `Consultation Call - ${name}`,
                description: `Phone: ${phone}\nService: ${services.join(', ')}\nOccupation: ${workProfile}\nGender: ${gender || 'prefer_not_to_say'}`,
                location: 'Phone Call',
                startDateTime: combinedDateTime,
                endDateTime: new Date(new Date(combinedDateTime).getTime() + 30 * 60000).toISOString()
            })

            const clientDetails = {
                name,
                phone,
                service: services.join(', '),
                preferredDate: preferredDate.toISOString().split('T')[0],
                preferredTime,
                gender: gender || 'prefer_not_to_say',
                occupation: workProfile
            }

            await emailService.sendBookingNotificationEmail(
                process.env.ADMIN_EMAIL,
                'Admin',
                clientDetails,
                calendarLinks
            )

            if (consultationRequest.assignedAdvisor) {
                const advisor = await userModel.findById(consultationRequest.assignedAdvisor);
                if (advisor?.email) {
                    await emailService.sendBookingNotificationEmail(
                        advisor.email,
                        advisor.name || 'Advisor',
                        clientDetails,
                        calendarLinks
                    )
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Consultation request submitted successfully',
            consultationRequest: {
                id: consultationRequest._id,
                name: consultationRequest.name,
                phone: consultationRequest.phone,
                status: consultationRequest.status
            }
        });
    } catch (error) {
        console.error('Consultation request error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit consultation request' });
    }
};

// Get all consultation requests (Admin only)
export const getAllConsultationRequests = async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 20, search } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const consultationRequests = await consultationRequestModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await consultationRequestModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            consultationRequests,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: parseInt(page)
            }
        });
    } catch (error) {
        console.error('Get consultation requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to get consultation requests' });
    }
};

// Get single consultation request
export const getConsultationRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const consultationRequest = await consultationRequestModel.findById(id);
        if (!consultationRequest) {
            return res.status(404).json({ success: false, message: 'Consultation request not found' });
        }

        res.status(200).json({
            success: true,
            consultationRequest
        });
    } catch (error) {
        console.error('Get consultation request error:', error);
        res.status(500).json({ success: false, message: 'Failed to get consultation request' });
    }
};

// Update consultation request status
export const updateConsultationRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, notes } = req.body;

        const validStatuses = ['new', 'contacted', 'follow_up_required', 'converted', 'closed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;

        if (notes) {
            updateData.$push = {
                notes: {
                    content: notes,
                    addedBy: req.user.userId,
                    addedAt: new Date()
                }
            };
        }

        const consultationRequest = await consultationRequestModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!consultationRequest) {
            return res.status(404).json({ success: false, message: 'Consultation request not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Consultation request updated successfully',
            consultationRequest
        });
    } catch (error) {
        console.error('Update consultation request error:', error);
        res.status(500).json({ success: false, message: 'Failed to update consultation request' });
    }
};

// Delete consultation request
export const deleteConsultationRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const consultationRequest = await consultationRequestModel.findByIdAndDelete(id);
        if (!consultationRequest) {
            return res.status(404).json({ success: false, message: 'Consultation request not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Consultation request deleted successfully'
        });
    } catch (error) {
        console.error('Delete consultation request error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete consultation request' });
    }
};

export const getMyConsultationRequests = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const consultationRequests = await consultationRequestModel.find({
            $or: [{ email: user.email }, { phone: user.phone }]
        }).populate('assignedAdvisor', 'name email phone').sort({ createdAt: -1 });
        res.json({ success: true, consultationRequests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get consultation requests' });
    }
};

// Book a call - alias for submitConsultationRequest
export const bookConsultation = async (req, res) => {
    return submitConsultationRequest(req, res);
};

export const getAdvisorAppointments = async (req, res) => {
    try {
        const consultationRequests = await consultationRequestModel.find({
            assignedAdvisor: req.user.userId
        }).populate('assignedAdvisor', 'name email phone').sort({ createdAt: -1 });
        res.json({ success: true, consultationRequests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get advisor appointments' });
    }
};

export default { submitConsultationRequest, getAllConsultationRequests, getConsultationRequest, updateConsultationRequestStatus, deleteConsultationRequest, getMyConsultationRequests, bookConsultation, getAdvisorAppointments };
