import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthService } from '../../services/auth.service';
import APIClient from '../../api/client';
import { TIMEOUTS, PAGES } from '../../config/constants';
import * as dom from '../../utils/dom';
import { z } from 'zod';

const changePasswordSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

export const ChangePasswordPage = () => {
    const form = document.createElement('form');
    form.id = "changePasswordForm";
    form.className = "flex flex-col gap-6";

    const otpInput = Input({
        label: "Verification Code",
        type: "text",
        id: "otp",
        name: "otp",
        placeholder: "000000",
        required: true,
        className: "text-center text-xl tracking-[0.3em] font-black"
    });
    otpInput.input.maxLength = 6;

    const newPasswordInput = Input({
        label: "New Password",
        type: "password",
        id: "newPassword",
        name: "newPassword",
        placeholder: "••••••••",
        required: true,
        icon: "👁️"
    });

    const submitBtn = Button({
        text: "Save New Password →",
        type: "submit",
        id: "submitBtn",
        className: "h-14 mt-4"
    });

    const cancelLink = document.createElement('div');
    cancelLink.className = "text-center mt-6 text-sm font-medium";
    cancelLink.innerHTML = `<a href="#/dashboard" class="text-slate-500 hover:text-indigo-600 transition-colors">Cancel and return to Dashboard</a>`;

    form.appendChild(otpInput.container);
    form.appendChild(newPasswordInput.container);
    form.appendChild(submitBtn);
    form.appendChild(cancelLink);

    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            dom.hideAlert();

            const formData = {
                otp: otpInput.input.value.trim(),
                newPassword: newPasswordInput.input.value
            };

            const result = changePasswordSchema.safeParse(formData);
            if (!result.success) {
                const errorStr = result.error.issues.map(err => err.message).join('<br>');
                throw new Error(errorStr);
            }

            dom.showLoading('submitBtn', 'Saving...');

            const response = await APIClient.changePassword('', formData.newPassword, formData.otp);

            if (response.success) {
                dom.showAlert('Password updated successfully!', 'success');
                setTimeout(() => window.location.hash = PAGES.DASHBOARD, TIMEOUTS.MEDIUM);
            }
        } catch (error: any) {
            dom.showAlert(error.message || 'Error occurred', 'danger');
            dom.hideLoading('submitBtn', 'Save New Password →');
        }
    };

    return AuthLayout("Update Password", "Enter your verification code and new password.", form);
};
