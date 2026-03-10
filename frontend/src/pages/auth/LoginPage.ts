import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthService } from '../../services/AuthService';
import APIClient from '../../api/client';
import { PAGES, TIMEOUTS } from '../../config/constants';
import * as dom from '../../utils/dom';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required')
});

export const LoginPage = () => {
    const form = document.createElement('form');
    form.id = "loginForm";
    form.className = "flex flex-col gap-6";

    const emailInput = Input({
        label: "Work Email",
        type: "email",
        id: "email",
        name: "email",
        placeholder: "you@company.com",
        required: true
    });

    const passwordInput = Input({
        label: "Password",
        type: "password",
        id: "password",
        name: "password",
        placeholder: "••••••••",
        required: true,
        icon: "👁️"
    });

    const alertContainer = document.createElement('div');
    alertContainer.id = "alertMessage";

    const submitBtn = Button({
        text: "Log in",
        type: "submit",
        id: "submitBtn",
        className: "h-14 mt-4"
    });

    const footer = document.createElement('div');
    footer.className = "text-center mt-8 text-sm font-medium space-y-3";
    footer.innerHTML = `
        <p class="text-slate-600">New here? <a href="#/signup" class="text-indigo-600 hover:text-indigo-800 transition-colors">Create an account</a></p>
        <p><a href="#/forgot-password" class="text-indigo-600 hover:text-indigo-800 transition-colors">Forgot your password?</a></p>
    `;

    form.appendChild(alertContainer);
    form.appendChild(emailInput.container);
    form.appendChild(passwordInput.container);
    form.appendChild(submitBtn);
    form.appendChild(footer);

    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            dom.hideAlert();

            const formData = {
                email: emailInput.input.value.trim(),
                password: passwordInput.input.value
            };

            const result = loginSchema.safeParse(formData);
            if (!result.success) {
                const errorStr = result.error.issues.map(err => err.message).join('<br>');
                throw new Error(errorStr);
            }

            dom.showLoading('submitBtn', 'Logging in...');

            const response = await APIClient.login(formData.email, formData.password);

            if (response.success) {
                const token = response.token || response.data?.token;
                const user = response.user || response.data?.user;

                if (token && user) {
                    AuthService.saveSession(token, user);
                }

                dom.showAlert('Welcome back!', 'success');

                const targetPath = user?.role === 'manager' ? PAGES.MANAGER_DASHBOARD : PAGES.DASHBOARD;
                setTimeout(() => window.location.hash = targetPath, TIMEOUTS.MEDIUM);
            }
        } catch (error: any) {
            dom.showAlert(error.message || 'Login failed', 'danger');
            dom.hideLoading('submitBtn', 'Log in');
        }
    };

    return AuthLayout("Sign In", "Welcome back! Please enter your details.", form);
};
