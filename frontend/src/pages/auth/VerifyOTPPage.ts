import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthService } from '../../services/AuthService';
import APIClient from '../../api/client';
import { SESSION_KEYS, TIMEOUTS, PAGES } from '../../config/constants';
import * as dom from '../../utils/dom';
import { z } from 'zod';

const verifyOtpSchema = z.object({
    otp: z.string().length(6, 'Please enter a valid 6-digit code')
});

export const VerifyOTPPage = () => {
    const signupData = AuthService.getSessionData(SESSION_KEYS.SIGNUP_DATA);
    const email = AuthService.getSessionData(SESSION_KEYS.VERIFICATION_EMAIL) || signupData?.email;
    const context = AuthService.getSessionData(SESSION_KEYS.VERIFICATION_CONTEXT) || 'signup';

    if (!email) {
        window.location.hash = PAGES.LOGIN;
        return document.createElement('div');
    }

    const form = document.createElement('form');
    form.id = "otpForm";
    form.className = "flex flex-col gap-6";

    const headerIcon = document.createElement('div');
    headerIcon.className = "flex justify-center mb-2";
    headerIcon.innerHTML = `
        <div class="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-sm border border-indigo-100 animate-bounce-slow">
            🛡️
        </div>
    `;
    form.appendChild(headerIcon);

    const otpInput = Input({
        label: "6-Digit Code",
        type: "text",
        id: "otp",
        name: "otp",
        placeholder: "000000",
        required: true,
        className: "text-center text-3xl tracking-[0.5em] font-black py-4"
    });
    otpInput.input.maxLength = 6;

    const alertContainer = document.createElement('div');
    alertContainer.id = "alertMessage";

    const submitBtn = Button({
        text: "Verify Account →",
        type: "submit",
        id: "submitBtn",
        className: "h-14 mt-4"
    });

    const resendLink = document.createElement('div');
    resendLink.className = "text-center mt-6 text-sm font-medium";
    resendLink.innerHTML = `<p class="text-slate-600">Didn't receive it? <button type="button" class="text-indigo-600 hover:text-indigo-800 transition-colors">Resend Code</button></p>`;
    resendLink.querySelector('button')!.onclick = async () => {
        try {
            dom.showAlert('Resending code...', 'info');
            await APIClient.resendVerificationEmail(email);
            dom.showAlert('New code sent!', 'success');
        } catch (error: any) {
            dom.showAlert(error.message || 'Error occurred', 'danger');
        }
    };

    form.appendChild(alertContainer);
    form.appendChild(otpInput.container);
    form.appendChild(submitBtn);
    form.appendChild(resendLink);

    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            dom.hideAlert();

            const formData = {
                otp: otpInput.input.value.trim()
            };

            const result = verifyOtpSchema.safeParse(formData);
            if (!result.success) {
                throw new Error(result.error.issues[0].message);
            }

            dom.showLoading('submitBtn', 'Verifying...');

            const code = formData.otp;
            const response = await APIClient.verifyOTP(email, code, context);

            if (response.success) {
                const { user, token } = response as any;
                if (token && user) {
                    AuthService.saveSession(token, user);
                }

                dom.showAlert('Identity Verified! Accessing your workspace...', 'success');

                const target = AuthService.isManager() ? PAGES.MANAGER_DASHBOARD : PAGES.DASHBOARD;
                setTimeout(() => window.location.hash = target, TIMEOUTS.MEDIUM);
            }
        } catch (error: any) {
            dom.showAlert(error.message || 'Error occurred', 'danger');
            dom.hideLoading('submitBtn', 'Verify Account →');
        }
    };

    return AuthLayout("Confirm Your Email", `We've sent a secure code to ${email}`, form);
};
