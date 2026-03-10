import { Router } from 'express';
import { authenticateToken, authorize, adminOnly } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as employeeController from '../controllers/employee.controller';

const router = Router();

// ===========================
// Protected Routes (All require authentication)
// ===========================

// Get all employees (Admin & Manager)
router.get('/', authenticateToken, authorize(['manager', 'admin']), asyncHandler(employeeController.getAllEmployees));
router.get('/get-employees', authenticateToken, authorize(['manager', 'admin']), asyncHandler(employeeController.getAllEmployees));

// Add employee (Admin only)
router.post('/add-employee', authenticateToken, adminOnly, asyncHandler(employeeController.addEmployee));

// Get employee by ID
router.get('/:id', authenticateToken, asyncHandler(employeeController.getEmployeeById));

// Update employee
router.put('/:id', authenticateToken, asyncHandler(employeeController.updateEmployee));

// Delete employee (Admin only)
router.delete('/:id', authenticateToken, adminOnly, asyncHandler(employeeController.deleteEmployee));

// Get employee statistics (Admin only)
router.get('/stats/summary', authenticateToken, adminOnly, asyncHandler(employeeController.getEmployeeStats));

// Team Management (Manager Only)
router.get('/team/my-team', authenticateToken, authorize(['manager', 'admin']), asyncHandler(employeeController.getTeamMembers));
router.post('/team/add', authenticateToken, authorize(['manager', 'admin']), asyncHandler(employeeController.addToTeam));
router.post('/team/remove', authenticateToken, authorize(['manager', 'admin']), asyncHandler(employeeController.removeFromTeam));

// Manager Approvals (Admin only)
router.get('/approvals/pending', authenticateToken, adminOnly, asyncHandler(employeeController.getPendingManagers));
router.patch('/:id/approve', authenticateToken, adminOnly, asyncHandler(employeeController.approveManager));

export default router;
