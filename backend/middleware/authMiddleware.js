import jwtService from '../services/jwtService.js';
import securityLogsModel from '../models/securityLogsModel.js';
import mongoose from 'mongoose';

// Extract IP and device info
export const getClientInfo = (req) => {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
    const userAgent = req.headers['user-agent'] || '';
    
    return { ip, userAgent };
};

// Log security event
export const logSecurityEvent = async (userId, email, action, status, reason = null, req) => {
    try {
        const { ip, userAgent } = getClientInfo(req);
        
        await securityLogsModel.create({
            userId: mongoose.isValidObjectId(userId) ? userId : null,
            email,
            action,
            ip,
            userAgent,
            status,
            reason,
            additionalData: {}
        });
    } catch (error) {
        console.error('Security logging error:', error);
    }
};

// Auth middleware - verify access token
export const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwtService.verifyAccessToken(token);
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};

// Admin middleware
export const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// Advisor middleware
export const advisorMiddleware = (req, res, next) => {
    if (req.user?.role !== 'advisor' && req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Advisor access required' });
    }
    next();
};

// Optional auth middleware
export const optionalAuthMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;
        
        if (token) {
            const decoded = jwtService.verifyAccessToken(token);
            if (decoded) {
                req.user = decoded;
            }
        }
        next();
    } catch (error) {
        next();
    }
};

export default { authMiddleware, adminMiddleware, advisorMiddleware, optionalAuthMiddleware, logSecurityEvent, getClientInfo };
