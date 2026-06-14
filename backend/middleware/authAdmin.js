import jwtService from '../services/jwtService.js';
import bcrypt from 'bcrypt';

let adminPasswordHash = null;

export const getAdminHash = async () => {
    if (!adminPasswordHash && process.env.ADMIN_PASSWORD) {
        adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    }
    return adminPasswordHash;
};

export const verifyAdminPassword = async (password) => {
    const hash = await getAdminHash();
    if (!hash) return false;
    return bcrypt.compare(password, hash);
};

export const clearAdminHash = () => {
    adminPasswordHash = null;
};

const authAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const atoken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers.atoken;

        if (!atoken) {
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
        }

        const decoded = jwtService.verifyAdminToken(atoken);
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
        }

        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
    }
};

export default authAdmin;
