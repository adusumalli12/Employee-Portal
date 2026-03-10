import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthService } from '../../services/AuthService';
import APIClient from '../../api/client';
import { TIMEOUTS, PAGES, SESSION_KEYS } from '../../config/constants';
import * as dom from '../../utils/dom';
import { z } from 'zod';

const resetPasswordSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

export const ResetPasswordPage = () => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const token = urlParams.get('token');
    const resetEmail = AuthService.getSessionData(SESSION_KEYS.RESET_EMAIL);

    const form = document.createElement('form');
    form.id = "resetForm";
    form.className = "flex flex-col gap-6";

    // If no token, we MUST have an OTP field and an Email from session
    const otpInput = Input({
        label: "Verification Code (OTP)",
        type: "text",
        id: "otp",
        name: "otp",
        placeholder: "123456",
        required: true,
        icon: "🔑"
    });

    const passwordInput = Input({
        label: "New Password",
        type: "password",
        id: "password",
        name: "password",
        placeholder: "••••••••",
        required: true,
        icon: "👁️"
    });

    const confirmInput = Input({
        label: "Confirm Password",
        type: "password",
        id: "confirmPassword",
        name: "confirmPassword",
        placeholder: "••••••••",
        required: true,
        icon: "👁️"
    });

    const alertContainer = document.createElement('div');
    alertContainer.id = "alertMessage";

    const submitBtn = Button({
        text: "Reset Password →",
        type: "submit",
        id: "submitBtn",
        className: "h-14 mt-4"
    });

    form.appendChild(alertContainer);

    // Only show OTP input if we don't have a token in the URL
    if (!token) {
        form.appendChild(otpInput.container);
    }

    form.appendChild(passwordInput.container);
    form.appendChild(confirmInput.container);
    form.appendChild(submitBtn);

    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            dom.hideAlert();

            const formData = {
                otp: token ? undefined : otpInput.input.value.trim(),
                password: passwordInput.input.value,
                confirmPassword: confirmInput.input.value
            };

            const result = resetPasswordSchema.safeParse(formData);
            if (!result.success) {
                const errorStr = result.error.issues.map(err => `• ${err.message}`).join('<br>');
                throw new Error(errorStr);
            }

            dom.showLoading('submitBtn', 'Processing...');

            const response = await APIClient.resetPassword(
                token,
                formData.password,
                resetEmail,
                formData.otp
            );

            if (response.success) {
                dom.showAlert('Password reset successful! Redirecting to login...', 'success');
                AuthService.clearSessionData(SESSION_KEYS.RESET_EMAIL);
                setTimeout(() => window.location.hash = PAGES.LOGIN, TIMEOUTS.MEDIUM);
            }
        } catch (error: any) {
            dom.showAlert(error.message || 'Error occurred', 'danger');
            dom.hideLoading('submitBtn', 'Reset Password →');
        }
    };

    const subtitle = resetEmail ? `Resetting password for ${resetEmail}` : "Enter your new password below.";
    return AuthLayout("Reset Password", subtitle, form);
};
