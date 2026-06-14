import jwtService from '../services/jwtService.js';
import userModel from '../models/userModel.js';

const authUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers.token || req.cookies?.accessToken);

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
        }

        const decoded = jwtService.verifyAccessToken(token);
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
        }

        const user = await userModel.findById(decoded.userId).select('_id email role disabled');
        if (!user || user.disabled) {
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
        }

        req.user = { userId: user._id.toString(), id: user._id.toString(), email: user.email, role: user.role };
        req.body.userId = user._id.toString();
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
    }
};

export default authUser;
