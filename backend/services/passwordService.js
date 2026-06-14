import bcrypt from 'bcrypt';

class PasswordService {
    checkPasswordStrength(password) {
        const feedback = [];

        if (!password) {
            return { valid: false, feedback: ['Password is required'] };
        }

        if (password.length < 8) feedback.push('Password should be at least 8 characters');
        if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
        if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
        if (!/\d/.test(password)) feedback.push('Add numbers');
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) feedback.push('Add special characters');

        return {
            valid: feedback.length === 0,
            feedback
        };
    }

    async hashPassword(password, rounds = 12) {
        return await bcrypt.hash(password, rounds);
    }

    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    isPasswordValid(password) {
        const result = this.checkPasswordStrength(password);
        return result.valid;
    }

    async isPasswordInHistory(newPassword, passwordHistory) {
        if (!passwordHistory || passwordHistory.length === 0) {
            return false;
        }

        for (let i = 0; i < Math.min(passwordHistory.length, 5); i++) {
            const match = await this.verifyPassword(newPassword, passwordHistory[i].hash);
            if (match) {
                return true;
            }
        }

        return false;
    }
}

export default new PasswordService();
