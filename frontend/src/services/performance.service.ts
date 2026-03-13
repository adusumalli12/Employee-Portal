import APIClient from '../api/client';

export class PerformanceService {
    static async getMyPerformance() {
        const res = await APIClient.getMyPerformance();
        return res;
    }

    static async reportActivity(action: string, value: number) {
        return await APIClient.reportActivity(action, value);
    }
}
