import express from 'express';
import {
    loginAdmin,
    loginAdminWithRecoveryCode,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    removeDoctor,
    getAllUsers,
    resetUserPassword,
    setUserDisabled,
    setAdvisorAccess,
    getConsultationRequestsAdmin,
    updateConsultationRequestAdmin,
    deleteConsultationRequestAdmin,
    assignConsultationRequest,
    updateRequestStatus
} from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import { authLimiter, adminLimiter } from '../middleware/securityConfig.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';

const adminRouter = express.Router();

adminRouter.post("/login", authLimiter, loginAdmin)
adminRouter.post("/login-recovery", authLimiter, loginAdminWithRecoveryCode)
adminRouter.post("/add-doctor", adminLimiter, authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/appointments", adminLimiter, authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", adminLimiter, authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", adminLimiter, authAdmin, allDoctors)
adminRouter.post("/change-availability", adminLimiter, authAdmin, changeAvailablity)
adminRouter.post("/remove-doctor", adminLimiter, authAdmin, removeDoctor)
adminRouter.get("/dashboard", adminLimiter, authAdmin, adminDashboard)
adminRouter.get("/all-users", adminLimiter, authAdmin, getAllUsers)
adminRouter.post("/reset-user-password", adminLimiter, authAdmin, resetUserPassword)
adminRouter.post("/set-user-disabled", adminLimiter, authAdmin, setUserDisabled)
adminRouter.post("/set-advisor-access", adminLimiter, authAdmin, setAdvisorAccess)
adminRouter.get("/consultation-requests", adminLimiter, authAdmin, getConsultationRequestsAdmin)
adminRouter.put("/consultation-requests/:id", adminLimiter, authAdmin, updateConsultationRequestAdmin)
adminRouter.put("/update-request-status/:id", adminLimiter, authAdmin, updateRequestStatus)
adminRouter.delete("/consultation-requests/:id", adminLimiter, authAdmin, deleteConsultationRequestAdmin)
adminRouter.post("/assign-consultation-request", adminLimiter, authAdmin, assignConsultationRequest)

export default adminRouter;
