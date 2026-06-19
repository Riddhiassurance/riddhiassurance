import { z } from 'zod';

// Phone number schema - Indian numbers
const indianPhoneSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
  .min(10, 'Phone number must be 10 digits')
  .max(10, 'Phone number must be 10 digits');

// Email schema
const emailSchema = z.string().email('Invalid email address');

// Password schema
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/\d/, 'Password must contain a number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain a special character');

// Registration schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: indianPhoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  profession: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required')
});

// Consultation request schema
export const consultationRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema.optional().or(z.literal('')),
  phone: indianPhoneSchema,
  age: z.number().min(18, 'Must be at least 18 years old').max(100, 'Invalid age'),
  workProfile: z.string().min(2, 'Work profile must be at least 2 characters')
});

// OTP verification schema
export const otpSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers')
});

// Validation helper
export const validate = async (schema, data) => {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    const errors = {};
    // Zod v4 exposes `.issues`; older versions used `.errors`. Guard for both
    // (and any non-Zod error) so validation never throws while typing.
    const issues = error?.issues || error?.errors || [];
    issues.forEach((err) => {
      const path = err.path?.[0];
      if (path) errors[path] = err.message;
    });
    return { success: false, errors };
  }
};
