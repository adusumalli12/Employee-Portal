import APIClient from '../api/client';

export interface AttendanceState {
    isClockedIn: boolean;
    clockInTime: number | null; // Timestamp
    lastClockOutTime: number | null;
    totalSecondsToday: number;
    isOnBreak: boolean;
    breakStartTime: number | null;
}

export class AttendanceService {
    private static readonly STORAGE_KEY = 'attendance_state';

    public static async refreshState(): Promise<AttendanceState> {
        try {
            const response = await APIClient.getTodayStatus() as any;
            if (response.success && response.attendance) {
                const att = response.attendance;
                const state: AttendanceState = {
                    isClockedIn: response.isClockedIn ?? (att.status === 'working' || att.status === 'on-break'),
                    clockInTime: att.checkIn ? new Date(att.checkIn).getTime() : null,
                    lastClockOutTime: att.checkOut ? new Date(att.checkOut).getTime() : null,
                    totalSecondsToday: response.totalSecondsToday || (att.totalSeconds || 0),
                    isOnBreak: att.status === 'on-break',
                    breakStartTime: null, // Simplified for now
                };
                this.saveState(state);
                return state;
            } else if (response.success) {
                // No attendance for today yet, or all sessions completed
                const state: AttendanceState = {
                    isClockedIn: false,
                    clockInTime: null,
                    lastClockOutTime: null,
                    totalSecondsToday: response.totalSecondsToday || 0,
                    isOnBreak: false,
                    breakStartTime: null,
                };
                this.saveState(state);
                return state;
            }
        } catch (err) {
            console.error('Failed to sync attendance from server', err);
        }
        return this.getState();
    }

    public static getState(): AttendanceState {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            isClockedIn: false,
            clockInTime: null,
            lastClockOutTime: null,
            totalSecondsToday: 0,
            isOnBreak: false,
            breakStartTime: null
        };
    }

    private static saveState(state: AttendanceState): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }

    public static async clockIn(): Promise<AttendanceState> {
        try {
            await APIClient.clockIn();
        } catch (err) {
            console.error('API clockIn failed', err);
            throw err;
        }

        return await this.refreshState();
    }

    public static async clockOut(): Promise<AttendanceState> {
        try {
            await APIClient.clockOut();
        } catch (err) {
            console.error('API clockOut failed', err);
            throw err;
        }

        return await this.refreshState();
    }

    public static async toggleBreak(): Promise<AttendanceState> {
        try {
            await APIClient.toggleBreak();
        } catch (err) {
            console.error('API toggleBreak failed', err);
            throw err;
        }

        return await this.refreshState();
    }

    public static async getStats(): Promise<any> {
        try {
            const response = await APIClient.getAttendanceStats();
            return response;
        } catch (err) {
            console.error('Failed to fetch stats', err);
            return null;
        }
    }
}
