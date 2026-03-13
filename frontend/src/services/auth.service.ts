import APIClient from '../api/client';
import { AuthUser } from '../types/auth';
import { PAGES } from '../config/constants';

export class AuthService {
    private static readonly TOKEN_KEY = 'auth_token';
    private static readonly USER_KEY = 'auth_user';

    public static saveSession(token: string, user: AuthUser): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    public static getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    public static getUser(): AuthUser | null {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    public static checkAuth(): boolean {
        return !!this.getToken();
    }

    public static hasRole(role: string): boolean {
        const user = this.getUser();
        return user?.role === role;
    }

    public static isAdmin(): boolean {
        const user = this.getUser();
        return user?.role === 'admin' || user?.role === 'superadmin';
    }

    public static isManager(): boolean {
        const user = this.getUser();
        return user?.role === 'manager';
    }

    public static getDashboardPath(): string {
        const user = this.getUser();
        if (!user) return PAGES.LOGIN;
        
        if (user.role === 'admin' || user.role === 'superadmin') {
            return PAGES.ADMIN_DASHBOARD;
        }
        
        if (user.role === 'manager') {
            return PAGES.MANAGER_DASHBOARD;
        }
        
        return PAGES.DASHBOARD;
    }

    public static async logout(): Promise<void> {
        try {
            await APIClient.logout();
        } catch (e) {
            console.error('Logout error', e);
        } finally {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            window.location.hash = '#/login';
        }
    }

    public static getRequiredAuth(hash: string): boolean {
        const publicRoutes = ['#/login', '#/signup', '#/forgot-password', '#/reset-password', '#/verify-email'];
        return !publicRoutes.includes(hash.split('?')[0]);
    }

    // Session Data (Verification Flow)
    public static setSessionData(key: string, value: any): void {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    public static getSessionData(key: string): any {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    public static clearSessionData(key: string): void {
        sessionStorage.removeItem(key);
    }
}
