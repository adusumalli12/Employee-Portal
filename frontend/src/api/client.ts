import { ApiResponse, ApiError } from '../types/api';
import { AuthUser, AuthResponse, SignupData } from '../types/auth';

/**
 * API Client
 * Handles all HTTP requests to the backend API
 */
class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Generic request method
   */
  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Get token from localStorage
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      credentials: 'include', // Important: includes HTTP-only cookies
    };

    try {
      const response = await fetch(url, config);
      const data = (await response.json()) as ApiResponse<T>;

      if (!response.ok) {
        const error: ApiError = {
          status: response.status,
          message: data.message || 'Request failed',
          data,
        };
        throw error;
      }

      return data;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 0,
        message: error.message || 'Network error',
        data: null,
      };
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // ===========================
  // Auth Endpoints
  // ===========================

  async signup(data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.post('/auth/signup', data);
  }

  async login(email: string, password: string): Promise<ApiResponse<any>> {
    return this.post('/auth/login', { email, password });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.post('/auth/logout');
  }

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return this.get(`/auth/verify-email/${token}`);
  }

  async resendVerificationEmail(email: string): Promise<ApiResponse<void>> {
    return this.post('/auth/resend-verification', { email });
  }

  async selectVerificationMethod(
    email: string,
    method: string
  ): Promise<ApiResponse<void>> {
    return this.post('/auth/select-verification-method', {
      email,
      verificationMethod: method,
    });
  }

  async verifyOTP(email: string, otp: string, context: string): Promise<AuthResponse> {
    return this.post('/auth/verify-otp', { email, otp, context });
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return this.post('/auth/forgot-password', { email });
  }

  async resetPassword(
    token: string | null,
    newPassword: string,
    email?: string,
    otp?: string
  ): Promise<ApiResponse<void>> {
    const endpoint = token ? `/auth/reset-password/${token}` : '/auth/reset-password';
    return this.post(endpoint, {
      newPassword,
      email,
      otp,
    });
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.get('/auth/me');
  }

  async updateProfile(data: Record<string, any>): Promise<ApiResponse<void>> {
    return this.put('/auth/update-profile', data);
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    otp?: string
  ): Promise<ApiResponse<void>> {
    return this.post('/auth/change-password', { currentPassword, newPassword, otp });
  }

  async requestPasswordChangeOTP(): Promise<ApiResponse<void>> {
    return this.post('/auth/request-password-change-otp');
  }

  async deleteAccount(): Promise<ApiResponse<void>> {
    return this.delete('/auth/delete-account');
  }

  // ===========================
  // Employee Endpoints
  // ===========================

  async getAllEmployees(): Promise<ApiResponse<any>> {
    return this.get('/employees');
  }

  async getEmployeeById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/employees/${id}`);
  }

  async updateEmployee(id: string, data: Record<string, any>): Promise<ApiResponse<void>> {
    return this.put(`/employees/${id}`, data);
  }

  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/employees/${id}`);
  }

  async getPendingManagers(): Promise<ApiResponse<any>> {
    return this.get('/employees/approvals/pending');
  }

  async approveManager(id: string): Promise<ApiResponse<any>> {
    return this.patch(`/employees/${id}/approve`);
  }

  async getMyTeam(): Promise<ApiResponse<any>> {
    return this.get('/employees/team/my-team');
  }

  async addToTeam(employeeId: string): Promise<ApiResponse<any>> {
    return this.post('/employees/team/add', { employeeId });
  }

  async removeFromTeam(employeeId: string): Promise<ApiResponse<any>> {
    return this.post('/employees/team/remove', { employeeId });
  }

  // ===========================
  // Attendance Endpoints
  // ===========================

  async clockIn(): Promise<ApiResponse<any>> {
    return this.post('/attendance/clock-in');
  }

  async clockOut(): Promise<ApiResponse<any>> {
    return this.post('/attendance/clock-out');
  }

  async toggleBreak(): Promise<ApiResponse<any>> {
    return this.post('/attendance/toggle-break');
  }

  async getTodayStatus(): Promise<ApiResponse<any>> {
    return this.get('/attendance/today-status');
  }

  async getAttendanceStats(): Promise<ApiResponse<any>> {
    return this.get('/attendance/stats');
  }

  // ===========================
  // Twilio Endpoints
  // ===========================

  async sendSMS(phoneNumber: string, message: string): Promise<ApiResponse<any>> {
    return this.post('/twilio/send-sms', { phoneNumber, message });
  }

  async getSMSStatus(messageSid: string): Promise<ApiResponse<any>> {
    return this.get(`/twilio/sms-status/${messageSid}`);
  }

  async getEmployeeReport(employeeId: string): Promise<ApiResponse<any>> {
    return this.get(`/attendance/report/${employeeId}`);
  }

  // ===========================
  // Performance Endpoints
  // ===========================

  async getMyPerformance(): Promise<ApiResponse<any>> {
    return this.get('/performance/my');
  }

  async getEmployeePerformance(employeeId: string): Promise<ApiResponse<any>> {
    return this.get(`/performance/employee/${employeeId}`);
  }

  async reportActivity(action: string, value: number): Promise<ApiResponse<any>> {
    return this.post('/performance/activity', { action, value });
  }

  async getTeamIntelligence(): Promise<ApiResponse<any>> {
    return this.get('/performance/team');
  }

  // ===========================
  // Task Endpoints
  // ===========================

  async createTask(data: { title: string; description?: string; employeeId: string; priority?: string; dueDate?: string }): Promise<ApiResponse<any>> {
    return this.post('/tasks/create', data);
  }

  async getTeamTasks(): Promise<ApiResponse<any>> {
    return this.get('/tasks/team');
  }

  async getMyTasks(): Promise<ApiResponse<any>> {
    return this.get('/tasks/my-tasks');
  }

  async updateTaskStatus(taskId: string, status: string): Promise<ApiResponse<any>> {
    return this.patch(`/tasks/${taskId}/status`, { status });
  }

  async updateTask(taskId: string, data: { title: string; description?: string; employeeId: string; priority?: string; status?: string }): Promise<ApiResponse<any>> {
    return this.put(`/tasks/${taskId}`, data);
  }

  async deleteTask(taskId: string): Promise<ApiResponse<any>> {
    return this.delete(`/tasks/${taskId}`);
  }

  // ===========================
  // Leave Endpoints
  // ===========================

  async applyLeave(data: { type: string; startDate: string; endDate: string; reason: string }): Promise<ApiResponse<any>> {
    return this.post('/leaves/apply', data);
  }

  async getMyLeaves(): Promise<ApiResponse<any>> {
    return this.get('/leaves/my-leaves');
  }

  async getTeamLeaves(): Promise<ApiResponse<any>> {
    return this.get('/leaves/team-leaves');
  }

  async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected'): Promise<ApiResponse<any>> {
    return this.patch(`/leaves/${leaveId}/status`, { status });
  }

  // ===========================
  // Notification Endpoints
  // ===========================

  async getNotifications(): Promise<ApiResponse<any>> {
    return this.get('/notifications');
  }

  async markNotificationRead(id: string): Promise<ApiResponse<any>> {
    return this.put(`/notifications/${id}/read`);
  }

  async markAllNotificationsRead(): Promise<ApiResponse<any>> {
    return this.put('/notifications/read-all');
  }
}

export default new APIClient();
