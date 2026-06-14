import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH || (process.env.JWT_SECRET + '_refresh');
const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || '15m';
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '7d';

class JWTService {
    generateAccessToken(userId, email, role) {
        if (!JWT_SECRET || JWT_SECRET.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters');
        }
        return jwt.sign(
            { userId, email, role, iat: Math.floor(Date.now() / 1000) },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRE }
        );
    }

    generateRefreshToken(userId) {
        if (!JWT_SECRET_REFRESH || JWT_SECRET_REFRESH.length < 32) {
            throw new Error('JWT_SECRET_REFRESH must be at least 32 characters');
        }
        return jwt.sign(
            { userId, iat: Math.floor(Date.now() / 1000) },
            JWT_SECRET_REFRESH,
            { expiresIn: REFRESH_TOKEN_EXPIRE }
        );
    }

    generateTokens(userId, email, role) {
        return {
            accessToken: this.generateAccessToken(userId, email, role),
            refreshToken: this.generateRefreshToken(userId)
        };
    }

    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded.userId || !decoded.role) return null;
            return decoded;
        } catch (error) {
            return null;
        }
    }

    verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET_REFRESH);
            if (!decoded.userId) return null;
            return decoded;
        } catch (error) {
            return null;
        }
    }

    decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    }

    generateAdminToken(userId, email) {
        if (!JWT_SECRET || JWT_SECRET.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters');
        }
        return jwt.sign(
            { userId, email, role: 'admin', iat: Math.floor(Date.now() / 1000) },
            JWT_SECRET,
            { expiresIn: '30m' }
        );
    }

    verifyAdminToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded.userId || decoded.role !== 'admin') return null;
            return decoded;
        } catch (error) {
            return null;
        }
    }

    generateSimpleToken(payload, expiresIn) {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn || '15m' });
    }

    verifySimpleToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
}

export default new JWTService();
