import { Button } from '../../components/Button';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthService } from '../../services/AuthService';
import APIClient from '../../api/client';
import { SESSION_KEYS, TIMEOUTS, PAGES } from '../../config/constants';
import * as dom from '../../utils/dom';

export const SelectVerificationPage = () => {
    const signupData = AuthService.getSessionData(SESSION_KEYS.SIGNUP_DATA);
    if (!signupData) {
        window.location.hash = PAGES.SIGNUP;
        return document.createElement('div');
    }

    const container = document.createElement('div');
    container.className = "flex flex-col gap-6";

    const alertContainer = document.createElement('div');
    alertContainer.id = "alertMessage";
    container.appendChild(alertContainer);

    const handleSelect = async (method: 'email' | 'sms') => {
        try {
            dom.hideAlert();
            dom.showAlert(`Sending OTP via ${method}...`, 'info');

            const response = await APIClient.selectVerificationMethod(signupData.email, method);

            if (response.success) {
                AuthService.setSessionData(SESSION_KEYS.VERIFICATION_EMAIL, signupData.email);
                window.location.hash = PAGES.VERIFY_OTP;
            }
        } catch (error: any) {
            dom.showAlert(error.message || 'Error occurred', 'danger');
        }
    };

    const emailBtn = Button({
        text: "Verify via Email",
        onClick: () => handleSelect('email'),
        className: "bg-white border hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm h-16 text-lg"
    });

    const smsBtn = Button({
        text: "Verify via SMS",
        onClick: () => handleSelect('sms'),
        className: "bg-white border hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm h-16 text-lg"
    });

    const helpText = document.createElement('p');
    helpText.className = "text-center text-slate-500 text-sm mt-4 font-medium";
    helpText.innerText = `Sending code to ${signupData.email}`;

    container.appendChild(emailBtn);
    container.appendChild(smsBtn);
    container.appendChild(helpText);

    return AuthLayout("Choose Verification", "Select how you'd like to receive your secure code.", container);
};
