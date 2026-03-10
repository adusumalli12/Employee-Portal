import { AuthLayout } from '../../layouts/AuthLayout';
import APIClient from '../../api/client';
import { TIMEOUTS, PAGES } from '../../config/constants';
import { AuthService } from '../../services/AuthService';
import * as dom from '../../utils/dom';

export const VerifyEmailPage = () => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const token = urlParams.get('token');

    const container = document.createElement('div');
    container.className = "flex flex-col gap-6 text-center py-10";

    const alertContainer = document.createElement('div');
    alertContainer.id = "alertMessage";
    container.appendChild(alertContainer);

    if (!token) {
        dom.showAlert('Invalid verification link.', 'danger');
        return AuthLayout("Email Verification", "The verification link is missing or malformed.", container);
    }

    const init = async () => {
        try {
            dom.showAlert('Connecting to server...', 'info');
            const response = await APIClient.verifyEmail(token);

            if (response.success) {
                const { user, token, role } = response as any;

                if (token && user) {
                    AuthService.saveSession(token, user);
                }

                if (role === 'manager') {
                    dom.showAlert('Email verified! Redirecting to Manager Dashboard...', 'success');
                    setTimeout(() => window.location.hash = PAGES.MANAGER_DASHBOARD, TIMEOUTS.MEDIUM);
                } else {
                    dom.showAlert('Email verified! Redirecting to Dashboard...', 'success');
                    setTimeout(() => window.location.hash = PAGES.DASHBOARD, TIMEOUTS.MEDIUM);
                }
            }
        } catch (error: any) {
            dom.showAlert(error.message || 'Error occurred', 'danger');
        }
    };

    init();

    return AuthLayout("Verifying Link", "Please wait while we secure your connection...", container);
};
