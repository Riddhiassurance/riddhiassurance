import express from 'express';
import { submitConsultationRequest, getAllConsultationRequests, getConsultationRequest, updateConsultationRequestStatus, deleteConsultationRequest, getMyConsultationRequests, bookConsultation, getAdvisorAppointments } from '../controllers/consultationController.js';
import { authMiddleware, adminMiddleware, advisorMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - Submit consultation request
router.post('/request', submitConsultationRequest);
router.post('/book', bookConsultation);
router.get('/my-requests', authMiddleware, getMyConsultationRequests);

// Advisor routes
router.get('/advisor-appointments', authMiddleware, advisorMiddleware, getAdvisorAppointments);

// Admin routes
router.get('/requests', authMiddleware, adminMiddleware, getAllConsultationRequests);
router.get('/request/:id', authMiddleware, adminMiddleware, getConsultationRequest);
router.put('/request/:id/status', authMiddleware, adminMiddleware, updateConsultationRequestStatus);
router.delete('/request/:id', authMiddleware, adminMiddleware, deleteConsultationRequest);

export default router;
