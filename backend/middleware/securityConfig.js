import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import mongoSanitize from 'mongo-sanitize';
import hpp from 'hpp';

export const helmetConfig = helmet({
contentSecurityPolicy: {
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: [],
    }
},
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    xssFilter: true,
    frameguard: {
        action: 'deny'
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    },
    hidePoweredBy: true
});

const standardRateLimitConfig = {
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
};

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    ...standardRateLimitConfig
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
    ...standardRateLimitConfig,
    keyGenerator: (req) => {
        const email = req.body?.email || req.body?.emailOrPhone || '';
        return `${ipKeyGenerator(req)}:${email}`;
    },
    skipSuccessfulRequests: true
});

export const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { success: false, message: 'Too many OTP requests, please try again later.' },
    ...standardRateLimitConfig,
    keyGenerator: (req) => {
        const identifier = req.body?.email || req.body?.phone || req.body?.emailOrPhone || '';
        return `${ipKeyGenerator(req)}:${identifier}`;
    }
});

export const otpPerMinuteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1,
    message: { success: false, message: 'Please wait before requesting another OTP.' },
    ...standardRateLimitConfig,
    keyGenerator: (req) => {
        const identifier = req.body?.email || req.body?.phone || req.body?.emailOrPhone || '';
        return `${ipKeyGenerator(req)}:${identifier}`;
    }
});

export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { success: false, message: 'Too many password reset attempts, please try again later.' },
    ...standardRateLimitConfig,
    keyGenerator: (req) => {
        const email = req.body?.emailOrPhone || req.body?.identifier || '';
        return `${ipKeyGenerator(req)}:${email}`;
    }
});

export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many admin requests, please try again later.' },
    ...standardRateLimitConfig
});

export const consultationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many consultation requests, please try again later.' },
    ...standardRateLimitConfig,
    keyGenerator: (req) => ipKeyGenerator(req)
});

export const sanitizationMiddleware = (req, res, next) => {
    req.body = sanitizeObject(mongoSanitize(req.body));
    req.params = sanitizeObject(mongoSanitize(req.params));
    req.query = sanitizeObject(mongoSanitize(req.query));
    next();
};

export const hppMiddleware = hpp({
    whitelist: ['sort', 'fields', 'limit', 'page']
});

const allowedOrigins = [
    'http://localhost:5173',                 // local frontend (Vite dev)
    'http://localhost:5174',                 // local admin panel (Vite dev)
    'http://localhost:3000',                 // local frontend (alt port)
    'https://riddhiassurance.vercel.app',    // deployed frontend (Vercel)
    process.env.FRONTEND_URL,                // optional override / extra origin
    process.env.ADMIN_PANEL_URL              // optional override / extra origin
].filter(Boolean);

export const corsConfig = {
    origin: function (origin, callback) {
        // Allow requests with no origin (curl, server-to-server, mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'atoken', 'rtoken', 'token']
};

const isProduction = process.env.NODE_ENV === 'production';

// In production the frontend (Vercel) and backend (Render) are on different
// sites, so cookies must be SameSite=None + Secure to be sent cross-site.
// Locally (same-site, HTTP) use 'lax' so cookies work without HTTPS.
const crossSiteCookie = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
};

export const cookieOptions = {
    ...crossSiteCookie,
    maxAge: 15 * 60 * 1000
};

export const refreshCookieOptions = {
    ...crossSiteCookie,
    maxAge: 7 * 24 * 60 * 60 * 1000
};

// clearCookie must use the same flags (secure/sameSite/httpOnly) it was set
// with, otherwise the browser won't match and remove the cookie.
export const clearCookieOptions = { ...crossSiteCookie };

export const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
};

export const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = Array.isArray(obj) ? [] : {};
    for (const [key, val] of Object.entries(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        if (typeof val === 'string') {
            sanitized[key] = sanitizeString(val);
        } else if (typeof val === 'object' && val !== null) {
            sanitized[key] = sanitizeObject(val);
        } else {
            sanitized[key] = val;
        }
    }
    return sanitized;
};

export const noCacheMiddleware = (req, res, next) => {
    if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/user') || req.path.startsWith('/api/admin')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
    next();
};
