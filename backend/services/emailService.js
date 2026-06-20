import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.apiKey = process.env.RESEND_API_KEY;
        this.fromAddress = process.env.EMAIL_FROM || 'Riddhi Assurance <onboarding@resend.dev>';
        // Fallback SMTP transporter — only created when RESEND_API_KEY is not set
        this._transporter = null;
        if (!this.apiKey) {
            try {
                this._transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_APP_PASSWORD
                    },
                    family: 4,
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 20000
                });
                console.log('[EMAIL] Initialized SMTP fallback transport');
            } catch (err) {
                console.warn('[EMAIL] Failed to init SMTP transport:', err.message);
            }
        }
    }

    async sendOTPEmail(email, otp, purpose = 'verification') {
        const purposes = {
            registration: 'Create Your Account',
            login: 'Login to Your Account',
            password_reset: 'Reset Your Password'
        };

        const subject = `Your ${purposes[purpose] || 'Verification'} OTP`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Riddhi Assurance</h2>
                <p style="color: #666; font-size: 16px;">Hello,</p>
                <p style="color: #666; font-size: 14px;">
                    Your One-Time Password (OTP) for ${purposes[purpose]} is:
                </p>
                <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                    <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${otp}</h1>
                </div>
                <p style="color: #666; font-size: 14px;">
                    This OTP is valid for 10 minutes only. Do not share this OTP with anyone.
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    If you didn't request this OTP, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">
                    Best regards,<br/>
                    <strong>Riddhi Assurance Team</strong>
                </p>
            </div>
        `;

        if (this.apiKey) {
            return await this._sendViaResend(email, subject, html);
        }
        return await this._sendViaFallback(email, subject, html);
    }

    async _sendViaResend(to, subject, html) {
        console.log('[EMAIL] Sending via Resend to:', to);
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: this.fromAddress,
                    to: [to],
                    subject,
                    html
                })
            });
            const body = await response.text();
            if (!response.ok) {
                console.error('[EMAIL] Resend API error:', response.status, body);
                return { success: false, message: `Email service error (${response.status})` };
            }
            console.log('[EMAIL] Sent via Resend successfully to:', to);
            return { success: true, message: 'OTP sent successfully' };
        } catch (error) {
            console.error('[EMAIL] Resend fetch error:', error);
            return { success: false, message: 'Failed to send OTP email' };
        }
    }

    async _sendViaFallback(to, subject, html) {
        if (!this._transporter) {
            console.log('[EMAIL] No email transport configured — set RESEND_API_KEY in Render env vars');
            return { success: false, message: 'No email transport configured' };
        }
        console.log('[EMAIL] Sending via SMTP fallback to:', to, 'from:', process.env.EMAIL_USER);
        try {
            await this._transporter.sendMail({
                from: process.env.EMAIL_USER,
                to,
                subject,
                html
            });
            console.log('[EMAIL] Sent via SMTP successfully to:', to);
            return { success: true, message: 'OTP sent successfully' };
        } catch (error) {
            console.error('[EMAIL] SMTP error:', error);
            return { success: false, message: 'Failed to send OTP email' };
        }
    }

    async sendVerificationEmail(email, verificationLink) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Riddhi Assurance</h2>
                <p style="color: #666; font-size: 16px;">
                    Welcome! Verify your email to complete your account setup.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Verify Email
                    </a>
                </div>
                <p style="color: #666; font-size: 12px;">
                    Or copy and paste this link:<br/>${verificationLink}
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
            </div>
        `;
        if (this.apiKey) {
            return await this._sendViaResend(email, 'Verify Your Email - Riddhi Assurance', html);
        }
        return await this._sendViaFallback(email, 'Verify Your Email - Riddhi Assurance', html);
    }

    async sendPasswordResetEmail(email, resetLink) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Riddhi Assurance</h2>
                <p style="color: #666; font-size: 16px;">We received a request to reset your password.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    If you didn't request this, please ignore this email.
                </p>
                <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
            </div>
        `;
        if (this.apiKey) {
            return await this._sendViaResend(email, 'Reset Your Password - Riddhi Assurance', html);
        }
        return await this._sendViaFallback(email, 'Reset Your Password - Riddhi Assurance', html);
    }

    generateCalendarLinks(eventDetails) {
        const { title, description, location, startDateTime, endDateTime } = eventDetails;
        const formatDate = (date) => new Date(date).toISOString().replace(/-|:|\.\d+/g, '');
        const start = formatDate(startDateTime);
        const end = formatDate(endDateTime);

        const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
            `&text=${encodeURIComponent(title)}` +
            `&dates=${start}/${end}` +
            `&details=${encodeURIComponent(description)}` +
            `&location=${encodeURIComponent(location)}`;

        const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?` +
            `subject=${encodeURIComponent(title)}` +
            `&startdt=${new Date(startDateTime).toISOString()}` +
            `&enddt=${new Date(endDateTime).toISOString()}` +
            `&body=${encodeURIComponent(description)}` +
            `&location=${encodeURIComponent(location)}`;

        return { googleLink, outlookLink };
    }

    async sendBookingNotificationEmail(toEmail, recipientName, clientDetails, calendarLinks) {
        const { name, phone, service, preferredDate, preferredTime, gender, occupation } = clientDetails;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Riddhi Assurance</h2>
                <p style="color: #666; font-size: 16px;">Hi ${recipientName},</p>
                <p style="color: #666; font-size: 14px;">A new consultation call has been booked. Here are the details:</p>
                <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #333; margin-top: 0;">Client Details:</h3>
                    <ul style="color: #666; padding-left: 20px; line-height: 1.8;">
                        <li><strong>Name:</strong> ${name}</li>
                        <li><strong>Phone:</strong> ${phone}</li>
                        <li><strong>Service:</strong> ${service}</li>
                        <li><strong>Preferred Date:</strong> ${preferredDate}</li>
                        <li><strong>Preferred Time:</strong> ${preferredTime}</li>
                        <li><strong>Gender:</strong> ${gender}</li>
                        <li><strong>Occupation:</strong> ${occupation}</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${calendarLinks.googleLink}" target="_blank" style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 0 10px 10px 0;">
                        Add to Google Calendar
                    </a>
                    <a href="${calendarLinks.outlookLink}" target="_blank" style="background-color: #0078D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 0 10px 10px 0;">
                        Add to Outlook Calendar
                    </a>
                </div>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">You can manage this booking from the admin panel.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">Best regards,<br/><strong>Riddhi Assurance Team</strong></p>
            </div>
        `;
        if (this.apiKey) {
            return await this._sendViaResend(toEmail, `New Consultation Call Booked - ${name}`, html);
        }
        return await this._sendViaFallback(toEmail, `New Consultation Call Booked - ${name}`, html);
    }

    async sendConsultationConfirmationEmail(email, name, consultationDetails) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Riddhi Assurance</h2>
                <p style="color: #666; font-size: 16px;">Thank you, ${name}!</p>
                <p style="color: #666; font-size: 14px;">We have received your consultation request. Our team will contact you shortly.</p>
                <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #333; margin-top: 0;">Consultation Details:</h3>
                    <ul style="color: #666; padding-left: 20px;">
                        <li>Name: ${consultationDetails.name}</li>
                        <li>Phone: ${consultationDetails.phone}</li>
                        <li>Age: ${consultationDetails.age}</li>
                        <li>Work Profile: ${consultationDetails.workProfile}</li>
                    </ul>
                </div>
                <p style="color: #666; font-size: 14px;">Expected Response Time: 24 hours</p>
            </div>
        `;
        if (this.apiKey) {
            return await this._sendViaResend(email, 'Consultation Request Received - Riddhi Assurance', html);
        }
        return await this._sendViaFallback(email, 'Consultation Request Received - Riddhi Assurance', html);
    }
}

export default new EmailService();
