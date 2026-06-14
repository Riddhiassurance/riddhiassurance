import express from 'express';
import { advisorMiddleware, authMiddleware } from '../middleware/authMiddleware.js';
import { advisorDashboard, assignedLeads, markNotificationRead, notifications, updateLead } from '../controllers/advisorController.js';

const advisorRouter = express.Router();

advisorRouter.use(authMiddleware, advisorMiddleware);
advisorRouter.get('/dashboard', advisorDashboard);
advisorRouter.get('/leads', assignedLeads);
advisorRouter.get('/clients', assignedLeads);
advisorRouter.put('/leads/:id', updateLead);
advisorRouter.get('/notifications', notifications);
advisorRouter.put('/notifications/:id/read', markNotificationRead);

export default advisorRouter;
