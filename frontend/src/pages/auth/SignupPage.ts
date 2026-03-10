import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { Button } from '../../components/Button';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthService } from '../../services/AuthService';
import APIClient from '../../api/client';
import { PAGES, TIMEOUTS, SESSION_KEYS } from '../../config/constants';
import * as dom from '../../utils/dom';
import { z } from 'zod';

const signupSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().regex(/^\+\d{6,15}$/, 'Invalid phone number format'),
    password: z.string().min(8, 'Password must be at least 8 chars'),
    location: z.string().min(2, 'Location is required'),
    position: z.string().min(2, 'Job position is required'),
});

export const SignupPage = () => {
    const form = document.createElement('form');
    form.id = "signupForm";
    form.className = "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5";

    const fNameInput = Input({ label: "First Name", type: "text", id: "firstName", name: "firstName", placeholder: "", required: true });
    const lNameInput = Input({ label: "Last Name", type: "text", id: "lastName", name: "lastName", placeholder: "", required: true });
    const emailInput = Input({ label: "Work Email", type: "email", id: "email", name: "email", placeholder: "", required: true, className: "col-span-1 md:col-span-2" });

    const phoneInput = PhoneInput({ label: "Phone Number", id: "phoneNumber", name: "phoneNumber", placeholder: "", required: true, className: "col-span-1 md:col-span-2" });

    const locInput = Input({ label: "City / Location", type: "text", id: "location", name: "location", placeholder: "", required: true });
    const posInput = Input({ label: "Job Role", type: "text", id: "position", name: "position", placeholder: "", required: true });

    const passwordInput = Input({ label: "Create Password", type: "password", id: "password", name: "password", placeholder: "", required: true, className: "col-span-1 md:col-span-2", icon: "👁️" });

    const alertContainer = document.createElement('div');
    alertContainer.id = "alertMessage";
    alertContainer.className = "col-span-1 md:col-span-2";

    const submitBtn = Button({ text: "Create Account", type: "submit", id: "submitBtn", className: "col-span-1 md:col-span-2 h-14 mt-4" });

    const footer = document.createElement('div');
    footer.className = "col-span-1 md:col-span-2 text-center mt-6 text-sm font-medium";
    footer.innerHTML = `<p class="text-slate-600">Already have an account? <a href="#/login" class="text-indigo-600 hover:text-indigo-800 transition-colors">Sign in</a></p>`;

    form.appendChild(alertContainer);
    // Split name into two fields side-by-side
    const nameRow = document.createElement('div');
    nameRow.className = "col-span-1 md:col-span-2 grid grid-cols-2 gap-4";
    nameRow.appendChild(fNameInput.container);
    nameRow.appendChild(lNameInput.container);

    form.appendChild(nameRow);
    form.appendChild(emailInput.container);
    form.appendChild(phoneInput.container);

    const detailRow = document.createElement('div');
    detailRow.className = "col-span-1 md:col-span-2 grid grid-cols-2 gap-4";
    detailRow.appendChild(locInput.container);
    detailRow.appendChild(posInput.container);

    // Add smart suggestions for Job Role
    const rolesList = document.createElement('datalist');
    rolesList.id = "role-suggestions";
    const roles = [
        "MERN Stack Developer",
        "Full Stack Developer",
        "Frontend Engineer (React)",
        "Backend Developer (Node.js)",
        "Production Support Engineer",
        "Quality Assurance (Testing)",
        "Manual & Automation Tester",
        "Product Manager",
        "Project Manager",
        "Team Lead / Manager",
        "DevOps Engineer",
        "UI/UX Designer"
    ];
    rolesList.innerHTML = roles.map(r => `<option value="${r}">`).join('');
    posInput.input.setAttribute('list', 'role-suggestions');
    posInput.container.appendChild(rolesList);

    // Add smart suggestions for Location (Indian IT Hubs)
    const locList = document.createElement('datalist');
    locList.id = "location-suggestions";
    const cities = [
        "Hyderabad, Telangana",
        "Bengaluru, Karnataka",
        "Pune, Maharashtra",
        "Chennai, Tamil Nadu",
        "Noida, Uttar Pradesh",
        "Gurugram, Haryana",
        "Mumbai, Maharashtra",
        "Kolkata, West Bengal",
        "Ahmedabad, Gujarat",
        "Coimbatore, Tamil Nadu",
        "Thiruvananthapuram, Kerala"
    ];
    locList.innerHTML = cities.map(c => `<option value="${c}">`).join('');
    locInput.input.setAttribute('list', 'location-suggestions');
    locInput.container.appendChild(locList);

    form.appendChild(detailRow);
    form.appendChild(passwordInput.container);

    // Manager Checkbox
    const managerControl = document.createElement('div');
    managerControl.className = "col-span-1 md:col-span-2 flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors";
    managerControl.innerHTML = `
        <input type="checkbox" id="isManager" name="role" value="manager" class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300">
        <div class="flex flex-col">
            <label for="isManager" class="font-black text-slate-800 cursor-pointer">Are you a Manager?</label>
            <p class="text-xs text-slate-500 font-bold">This requires administrative approval after verification.</p>
        </div>
    `;
    form.appendChild(managerControl);

    form.appendChild(submitBtn);
    form.appendChild(footer);

    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            dom.hideAlert();

            const rawData = {
                firstName: fNameInput.input.value.trim(),
                lastName: lNameInput.input.value.trim(),
                email: emailInput.input.value.trim(),
                phoneNumber: phoneInput.getFullNumber(),
                password: passwordInput.input.value,
                location: locInput.input.value.trim(),
                position: posInput.input.value.trim(),
            };

            const result = signupSchema.safeParse(rawData);
            if (!result.success) {
                const errorStr = result.error.issues.map(err => `• ${err.message}`).join('<br>');
                throw new Error(errorStr);
            }

            dom.showLoading('submitBtn', 'Processing...');

            // API Expects `name` instead of first/last name, so we merge them.
            // API expects `company`, `salary`, `experience` - we provide defaults if the API requires them.
            const isManager = (form.querySelector('#isManager') as HTMLInputElement).checked;
            const role = isManager ? 'manager' : 'user';

            const apiData = {
                name: `${rawData.firstName} ${rawData.lastName}`.trim(),
                email: rawData.email,
                phoneNumber: rawData.phoneNumber,
                password: rawData.password,
                location: rawData.location,
                position: rawData.position,
                role: role,
                // Adding defaults for legacy fields:
                company: "N/A",
                salary: 0,
                experience: 0
            };

            const response = await APIClient.signup(apiData);
            if (response.success) {
                // Auto-trigger Email verification method
                await APIClient.selectVerificationMethod(rawData.email, 'email').catch(() => { });

                AuthService.setSessionData(SESSION_KEYS.SIGNUP_DATA, apiData);
                AuthService.setSessionData(SESSION_KEYS.VERIFICATION_EMAIL, rawData.email);
                AuthService.setSessionData(SESSION_KEYS.VERIFICATION_CONTEXT, 'signup');

                dom.showAlert('Account created! Please check your email for the verification code.', 'success');
                setTimeout(() => window.location.hash = PAGES.VERIFY_OTP, TIMEOUTS.MEDIUM);
            }
        } catch (error: any) {
            dom.showAlert(error.message || 'Signup failed', 'danger');
            dom.hideLoading('submitBtn', 'Create Account');
        }
    };

    return AuthLayout("Join Us", "Join thousands of teams managing work easily.", form);
};
