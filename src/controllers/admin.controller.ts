import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Employee } from '../models/employee.model';
import { Task } from '../models/task.model';
import { Leave } from '../models/leave.model';
import { HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';
import EmailService from '../services/email.service';

/**
 * Admin Controller
 * Handles administrative operations for Super Admins
 */

export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const totalEmployees = await Employee.countDocuments({ role: 'user' });
    const totalManagers = await Employee.countDocuments({ role: 'manager' });
    const pendingManagers = await Employee.countDocuments({ role: 'manager', isApproved: false, isEmailVerified: true });
    const activeTasks = await Task.countDocuments({ status: { $ne: 'done' } });
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    console.log(`[AdminStats] Pending Managers Count: ${pendingManagers}`);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
            totalEmployees,
            totalManagers,
            pendingManagers,
            activeTasks,
            pendingLeaves
        }
    });
});

export const getPendingManagers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const managers = await Employee.find({ role: 'manager', isApproved: false, isEmailVerified: true })
        .select('-password')
        .sort({ createdAt: -1 });

    console.log(`[AdminPending] Found ${managers.length} pending managers`);
    if (managers.length > 0) {
        console.log(`[AdminPending] First manager email: ${managers[0]?.email}`);
    }

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: managers
    });
});

export const approveManager = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { managerId } = req.params;
    const { approve } = req.body; // boolean

    const manager = await Employee.findById(managerId);

    if (!manager || manager.role !== 'manager') {
        res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Manager not found'
        });
        return;
    }

    if (approve) {
        manager.isApproved = true;
        await manager.save();

        // Notify manager via email
        await EmailService.sendManagerApprovedEmail(manager.email, manager.name)
            .catch((err: any) => console.error('Email error:', err));

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Manager approved successfully'
        });
    } else {
        // If rejected, we might want to delete or keep as rejected
        await Employee.findByIdAndDelete(managerId);
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Manager request rejected and account removed'
        });
    }
});

export const getAllEmployees = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const employees = await Employee.find()
        .populate('managerId', 'name')
        .select('-password')
        .sort({ name: 1 });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: employees
    });
});

export const getGlobalTasks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const tasks = await Task.find()
        .populate('employee', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tasks
    });
});

export default {
    getDashboardStats,
    getPendingManagers,
    approveManager,
    getAllEmployees,
    getGlobalTasks
};
