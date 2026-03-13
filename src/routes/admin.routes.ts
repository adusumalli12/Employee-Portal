import { Router } from 'express';
import { authenticateToken, superadminOnly } from '../middleware/auth';
import adminController from '../controllers/admin.controller';

const router = Router();

// All routes here require superadmin access
router.use(authenticateToken);
router.use(superadminOnly);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard overview stats
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/admin/pending-managers
 * @desc    Get all managers waiting for approval
 */
router.get('/pending-managers', adminController.getPendingManagers);

/**
 * @route   POST /api/admin/approve-manager/:managerId
 * @desc    Approve or reject a manager
 */
router.post('/approve-manager/:managerId', adminController.approveManager);

/**
 * @route   GET /api/admin/employees
 * @desc    Get global list of all employees
 */
router.get('/employees', adminController.getAllEmployees);

/**
 * @route   GET /api/admin/tasks
 * @desc    Get global list of all tasks
 */
router.get('/tasks', adminController.getGlobalTasks);

export default router;
