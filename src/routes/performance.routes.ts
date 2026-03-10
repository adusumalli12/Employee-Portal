import { Router } from 'express';
import performanceController from '../controllers/performance.controller';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// All performance routes require authentication
router.use(authenticateToken);

router.get('/my', performanceController.getMyPerformance);
router.get('/team', authorize(['manager', 'admin', 'superadmin']), performanceController.getTeamIntelligence);
router.get('/employee/:employeeId', authorize(['manager', 'admin', 'superadmin']), performanceController.getEmployeePerformance);
router.post('/activity', performanceController.updateActivity);

export default router;
