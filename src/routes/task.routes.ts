import { Router } from 'express';
import taskController from '../controllers/task.controller';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

// Manager/Admin routes
router.post('/create', authorize(['manager', 'admin', 'superadmin']), taskController.createTask);
router.get('/team', authorize(['manager', 'admin', 'superadmin']), taskController.getTeamTasks);
router.get('/employee/:employeeId', authorize(['manager', 'admin', 'superadmin']), taskController.getEmployeeTasks);
router.put('/:taskId', authorize(['manager', 'admin', 'superadmin']), taskController.updateTask);
router.delete('/:taskId', authorize(['manager', 'admin', 'superadmin']), taskController.deleteTask);

// Common routes (Employees can update their own task status)
router.get('/my-tasks', taskController.getMyTasks);
router.patch('/:taskId/status', taskController.updateTaskStatus);

export default router;
