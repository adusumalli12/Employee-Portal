import { Router } from 'express';
import * as leaveController from '../controllers/leave.controller';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticateToken);

// Employee routes
router.post('/apply', leaveController.applyLeave);
router.get('/my-leaves', leaveController.getMyLeaves);

// Manager routes
router.get('/team-leaves', authorize(['manager', 'admin', 'superadmin']), leaveController.getTeamLeaves);
router.patch('/:leaveId/status', authorize(['manager', 'admin', 'superadmin']), leaveController.updateLeaveStatus);

export default router;
