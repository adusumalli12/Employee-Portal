import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthService } from '../../services/auth.service';
import APIClient from '../../api/client';
import { SESSION_KEYS, TIMEOUTS, PAGES } from '../../config/constants';
import * as dom from '../../utils/dom';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address')
});

export const ForgotPasswordPage = () => {
    const form = document.createElement('form');
    form.id = "forgotForm";
    form.className = "flex flex-col gap-6";

    const emailInput = Input({
        label: "Email Address",
        type: "email",
        id: "email",
        name: "email",
        placeholder: "you@company.com",
        required: true
    });

    const submitBtn = Button({
        text: "Send Reset Link →",
        type: "submit",
        id: "submitBtn",
        className: "h-14 mt-4"
    });

    const footer = document.createElement('div');
    footer.className = "text-center mt-6 text-sm font-medium";
    footer.innerHTML = `<p class="text-slate-600">Remember your password? <a href="#/login" class="text-indigo-600 hover:text-indigo-800 transition-colors">Back to Login</a></p>`;

    form.appendChild(emailInput.container);
    form.appendChild(submitBtn);
    form.appendChild(footer);

    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            dom.hideAlert();

            const formData = {
                email: emailInput.input.value.trim()
            };

            const result = forgotPasswordSchema.safeParse(formData);
            if (!result.success) {
                const errorStr = result.error.issues.map(err => err.message).join('<br>');
                throw new Error(errorStr);
            }

            dom.showLoading('submitBtn', 'Processing...');

            const response = await APIClient.forgotPassword(formData.email);

            if (response.success) {
                AuthService.setSessionData(SESSION_KEYS.RESET_EMAIL, formData.email);
                dom.showAlert('Verification code sent to your email!', 'success');
                setTimeout(() => window.location.hash = PAGES.RESET_PASSWORD, TIMEOUTS.MEDIUM);
            }
        } catch (error: any) {
            dom.showAlert(error.message || 'Error occurred', 'danger');
            dom.hideLoading('submitBtn', 'Send Reset Link →');
        }
    };

    return AuthLayout("Forgot Password", "We'll send you reset instructions.", form);
};
