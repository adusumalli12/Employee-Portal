import { Router } from 'express';
import {
    clockIn,
    clockOut,
    toggleBreak,
    getTodayStatus,
    getStats,
    getEmployeeReport
} from '../controllers/attendance.controller';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// All attendance routes require authentication
router.use(authenticateToken);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/toggle-break', toggleBreak);
router.get('/today-status', getTodayStatus);
router.get('/stats', getStats);

// Report Generation (Managers & Admins)
router.get('/report/:employeeId', authorize(['manager', 'admin']), getEmployeeReport);

export default router;
