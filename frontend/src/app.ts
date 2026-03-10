import { Router } from './router/Router';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { Dashboard } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { SelectVerificationPage } from './pages/auth/SelectVerificationPage';
import { VerifyOTPPage } from './pages/auth/VerifyOTPPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { AdminApprovalPage } from './pages/admin/AdminApprovalPage';
import { AuthService } from './services/AuthService';
import { PAGES } from './config/constants';

document.addEventListener('DOMContentLoaded', async () => {
    const router = new Router('app');

    // Add Routes
    router.addRoute(PAGES.LOGIN, LoginPage);
    router.addRoute(PAGES.SIGNUP, SignupPage);
    router.addRoute(PAGES.DASHBOARD, Dashboard);
    router.addRoute(PAGES.MANAGER_DASHBOARD, ManagerDashboardPage);
    router.addRoute(PAGES.ADMIN_APPROVALS, AdminApprovalPage);
    router.addRoute(PAGES.FORGOT_PASSWORD, ForgotPasswordPage);
    router.addRoute(PAGES.RESET_PASSWORD, ResetPasswordPage);
    router.addRoute(PAGES.SELECT_VERIFICATION, SelectVerificationPage);
    router.addRoute(PAGES.VERIFY_OTP, VerifyOTPPage);
    router.addRoute(PAGES.VERIFY_EMAIL, VerifyEmailPage);
    router.addRoute(PAGES.CHANGE_PASSWORD, ChangePasswordPage);

    // Global Middleware / Guard
    const handleRouteChange = async () => {
        const hash = window.location.hash || PAGES.LOGIN;
        const isAuth = await AuthService.checkAuth();
        const needsAuth = AuthService.getRequiredAuth(hash);

        if (needsAuth && !isAuth) {
            window.location.hash = PAGES.LOGIN;
            return;
        }

        if (isAuth) {
            // Role Based Redirection
            if (hash === PAGES.LOGIN || hash === PAGES.SIGNUP) {
                const target = AuthService.isManager() ? PAGES.MANAGER_DASHBOARD : PAGES.DASHBOARD;
                window.location.hash = target;
                return;
            }

            // Role Based Restrictions
            if (hash === PAGES.MANAGER_DASHBOARD && !AuthService.isManager() && !AuthService.isAdmin()) {
                window.location.hash = PAGES.DASHBOARD;
            }
            if (hash === PAGES.DASHBOARD && AuthService.isManager()) {
                window.location.hash = PAGES.MANAGER_DASHBOARD;
            }
            if (hash === PAGES.ADMIN_APPROVALS && !AuthService.isAdmin()) {
                window.location.hash = PAGES.DASHBOARD;
            }
        }
    };

    window.addEventListener('hashchange', handleRouteChange);

    // Initial Guard check
    await handleRouteChange();

    router.start();
});
