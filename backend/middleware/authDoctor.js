import jwtService from '../services/jwtService.js';
import doctorModel from '../models/doctorModel.js';

const authDoctor = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const dtoken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers.dtoken;

        if (!dtoken) {
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
        }

        const decoded = jwtService.verifyAccessToken(dtoken);
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
        }

        if (decoded.role !== 'doctor') {
            return res.status(403).json({ success: false, message: 'Doctor access required' });
        }

        const doctor = await doctorModel.findById(decoded.userId).select('-password');
        if (!doctor) {
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
        }

        req.user = { userId: decoded.userId, id: decoded.userId, email: doctor.email, role: 'doctor' };
        req.body.docId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
    }
};

export default authDoctor;
