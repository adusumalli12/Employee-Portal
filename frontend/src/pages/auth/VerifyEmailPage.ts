import { AuthLayout } from '../../layouts/AuthLayout';
import APIClient from '../../api/client';
import { TIMEOUTS, PAGES } from '../../config/constants';
import { AuthService } from '../../services/auth.service';
import * as dom from '../../utils/dom';

export const VerifyEmailPage = () => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const token = urlParams.get('token');

    const container = document.createElement('div');
    container.className = "flex flex-col gap-6 text-center py-10";

    if (!token) {
        dom.showAlert('Invalid verification link.', 'danger');
        return AuthLayout("Email Verification", "The verification link is missing or malformed.", container);
    }

    const init = async () => {
        try {
            dom.showAlert('Connecting to server...', 'info');
            const response = await APIClient.verifyEmail(token);

            if (response.success) {
                const { user, token: loginToken, message } = response as any;

                if (loginToken && user) {
                    AuthService.saveSession(loginToken, user);
                }

                const targetPath = AuthService.getDashboardPath();
                dom.showAlert(message || `Email verified! Redirecting...`, 'success');
                setTimeout(() => window.location.hash = targetPath, TIMEOUTS.MEDIUM);
            }
        } catch (error: any) {
            dom.showAlert(error.message || 'Error occurred', 'danger');
        }
    };

    init();

    return AuthLayout("Verifying Link", "Please wait while we secure your connection...", container);
};
