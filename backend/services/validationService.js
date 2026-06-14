import Joi from 'joi';

// Define reusable schemas
const nameSchema = Joi.string().min(2).max(100).required().trim();
const emailSchema = Joi.string().email().lowercase().required();
const phoneSchema = Joi.string().pattern(/^[6-9]\d{9}$/).required(); // Indian phone number
const ageSchema = Joi.number().min(18).max(100).required();
const passwordSchema = Joi.string()
    .min(8)
    .pattern(/[A-Z]/) // Uppercase
    .pattern(/[a-z]/) // Lowercase
    .pattern(/\d/) // Number
    .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/) // Special character
    .required()
    .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
        'string.min': 'Password must be at least 8 characters'
    });

// Registration validation
export const registerValidation = Joi.object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match'
    }),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    image: Joi.string().optional(),
    profession: Joi.string().max(100).optional().allow('')
});

// Login validation
export const loginValidation = Joi.object({
    email: emailSchema,
    password: Joi.string().required()
});

// OTP login validation
export const otpLoginValidation = Joi.object({
    phone: phoneSchema
});

// OTP verification validation
export const otpVerificationValidation = Joi.object({
    email: emailSchema,
    otp: Joi.string().length(6).pattern(/^\d+$/).required()
});

// Consultation request validation
export const consultationRequestValidation = Joi.object({
    name: nameSchema,
    email: Joi.string().email().lowercase().allow(null, ''),
    phone: phoneSchema,
    age: ageSchema,
    workProfile: Joi.string().min(2).max(100).required().trim(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    services: Joi.array().items(Joi.string()).optional(),
    preferredDate: Joi.date().optional(),
    preferredTime: Joi.string().optional()
});

// Update profile validation
export const updateProfileValidation = Joi.object({
    name: Joi.string().min(2).max(100).trim(),
    age: Joi.number().min(18).max(100),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
    phone: phoneSchema,
    address: Joi.object({
        line1: Joi.string().max(100),
        line2: Joi.string().max(100),
        city: Joi.string().max(50),
        state: Joi.string().max(50),
        zip: Joi.string().pattern(/^\d{5}$/)
    })
}).min(1);

// Change password validation
export const changePasswordValidation = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

// Forgot password - step 1
export const forgotPasswordStep1Validation = Joi.object({
    emailOrPhone: Joi.alternatives().try(
        Joi.string().email(),
        Joi.string().pattern(/^[6-9]\d{9}$/)
    ).required()
});

// Reset password validation
export const resetPasswordValidation = Joi.object({
    email: emailSchema,
    newPassword: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

// Validation helper function
export const validateSchema = (schema, data) => {
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        const errors = {};
        error.details.forEach(detail => {
            errors[detail.path[0]] = detail.message;
        });
        return { valid: false, errors };
    }
    return { valid: true, value };
};
