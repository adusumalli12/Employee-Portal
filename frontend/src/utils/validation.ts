import { FORM_VALIDATION_RULES } from '../config/constants';

export const validateEmail = (email: string): boolean => {
    return FORM_VALIDATION_RULES.EMAIL_REGEX.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < FORM_VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        errors.push(`Password must be at least ${FORM_VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`);
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain lowercase letters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain uppercase letters');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain numbers');
    }
    if (!/[@$!%*?&]/.test(password)) {
        errors.push('Password must contain special characters (@$!%*?&)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

export const validateForm = (
    data: Record<string, string>,
    requiredFields: string[]
): { valid: boolean; error?: string } => {
    for (const field of requiredFields) {
        if (!data[field] || !data[field].trim()) {
            return { valid: false, error: `${field} is required` };
        }
    }
    return { valid: true };
};
