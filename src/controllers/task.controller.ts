import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Task } from '../models/Task';
import { Employee } from '../models/Employee';
import { HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';
import { Notification } from '../models/Notification';

/**
 * Task Controller
 * Handles creation, assignment, and status updates of tasks
 */

export const createTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, employeeId, priority, dueDate } = req.body;

    if (!title || !employeeId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Title and Employee are required'
        });
        return;
    }

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Employee not found'
        });
        return;
    }

    const task = await Task.create({
        title,
        description,
        employee: employeeId,
        createdBy: req.user?.id,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: 'todo'
    });

    // Notify employee
    await Notification.create({
        recipient: employeeId,
        sender: req.user?.id,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${title}`,
        type: 'task_assigned',
        relatedId: task._id
    });

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Task created and assigned successfully',
        data: task
    });
});

export const updateTaskStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!['todo', 'in-progress', 'review', 'done'].includes(status)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid status'
        });
        return;
    }

    const task = await Task.findByIdAndUpdate(
        taskId,
        {
            status,
            completedAt: status === 'done' ? new Date() : undefined
        },
        { new: true }
    );

    if (!task) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Task not found'
        });
        return;
    }

    if (status === 'done' && task) {
        // Notify manager
        await Notification.create({
            recipient: task.createdBy,
            sender: req.user?.id,
            title: 'Task Completed',
            message: `${req.user?.name || 'An employee'} has completed the task: ${task.title}`,
            type: 'task_completed',
            relatedId: task._id
        });
    }

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Task status updated',
        data: task
    });
});

export const getEmployeeTasks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { employeeId } = req.params;

    const tasks = await Task.find({ employee: employeeId }).sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tasks
    });
});

export const getTeamTasks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    // Only managers can see their team's tasks (Handled by middleware)
    const managerId = req.user?.id;

    // Get all employees for this manager
    const teamMembers = await Employee.find({ managerId }).select('_id');
    const memberIds = teamMembers.map(m => m._id);

    const tasks = await Task.find({ employee: { $in: memberIds } })
        .populate('employee', 'name position')
        .sort({ updatedAt: -1 });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tasks
    });
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const { title, description, employeeId, priority, status } = req.body;

    const task = await Task.findByIdAndUpdate(
        taskId,
        {
            title,
            description,
            employee: employeeId,
            priority,
            status,
            completedAt: status === 'done' ? new Date() : undefined
        },
        { new: true }
    );

    if (!task) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Task not found'
        });
        return;
    }

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Task updated successfully',
        data: task
    });
});

export const getMyTasks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.id;

    const tasks = await Task.find({ employee: employeeId }).sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tasks
    });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId } = req.params;

    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Task not found'
        });
        return;
    }

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Task deleted successfully'
    });
});

export default {
    createTask,
    updateTaskStatus,
    getEmployeeTasks,
    getMyTasks,
    getTeamTasks,
    updateTask,
    deleteTask
};
