import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Performance } from '../models/performance.model';
import { Task } from '../models/task.model';
import { Employee } from '../models/employee.model';
import { HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Performance Controller
 * Handles real-time performance tracking and task flow
 */

export const getMyPerformance = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Get or create today's performance record
    let perf = await Performance.findOne({ employee: req.user.id, date: todayStr });
    if (!perf) {
        perf = await Performance.create({
            employee: req.user.id,
            date: todayStr,
            score: 0,
            metrics: { tasksCompleted: 0, accuracy: 0, speed: 0, quality: 0 }
        });
    }

    // Graph Data Logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTasks = await Task.find({
        employee: req.user.id,
        $or: [
            { createdAt: { $gte: today } },
            { completedAt: { $gte: today } }
        ]
    });

    const timeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00'];
    
    const productivityFlow = timeSlots.map(time => {
        const hour = parseInt(time.split(':')[0] || '0');
        const input = dailyTasks.filter(t => {
            const tHour = new Date(t.createdAt as any).getHours();
            return tHour >= hour - 2 && tHour < hour;
        }).length;
        const output = dailyTasks.filter(t => {
            if (!t.completedAt) return false;
            const tHour = new Date(t.completedAt as any).getHours();
            return tHour >= hour - 2 && tHour < hour;
        }).length;
        return { time, input, output };
    });

    const efficiencyMetrics = timeSlots.map((time, idx) => {
        const hour = parseInt(time.split(':')[0] || '0');
        const totalActive = dailyTasks.filter(t => new Date(t.createdAt as any).getHours() < hour).length;
        const totalDone = dailyTasks.filter(t => t.completedAt && new Date(t.completedAt as any).getHours() < hour).length;
        const efficiency = totalActive > 0 ? (totalDone / totalActive) * 100 : 0;
        const errors = dailyTasks.filter(t => t.status === 'review' && new Date(t.updatedAt as any).getHours() < hour).length;
        return { time, efficiency: Math.min(efficiency, 100), errors };
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        performance: perf,
        graphs: { productivityFlow, efficiencyMetrics },
        history: await Performance.find({ employee: req.user.id }).limit(7).sort({ date: -1 })
    });
});

export const getEmployeePerformance = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { employeeId } = req.params;

    const performance = await Performance.find({ employee: employeeId }).sort({ date: -1 }).limit(30);
    const tasks = await Task.find({ employee: employeeId }).sort({ updatedAt: -1 });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        performance,
        tasks
    });
});

export const updateActivity = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
    }

    const { action, value } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const perf = await Performance.findOneAndUpdate(
        { employee: req.user.id, date: today },
        {
            $push: { activityLog: { time: new Date(), action, value } },
            $inc: { score: value > 0 ? 1 : -1 }
        },
        { new: true, upsert: true }
    );

    res.status(HTTP_STATUS.OK).json({ success: true, performance: perf });
});

export const getTeamIntelligence = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
    }

    const teamMembers = req.user.role === 'superadmin' 
        ? await Employee.find({ role: { $ne: 'superadmin' } }).select('name position')
        : await Employee.find({ managerId: req.user.id }).select('name position');

    const memberIds = teamMembers.map(m => m._id);

    // 1. Task Status Distribution
    const taskStats = await Task.aggregate([
        { $match: { employee: { $in: memberIds } } },
        {
            $group: {
                _id: { employee: "$employee", status: "$status" },
                count: { $sum: 1 }
            }
        }
    ]);

    const teamAnalytics = teamMembers.map(member => {
        const memberStats = taskStats.filter(s => s._id.employee.toString() === member._id.toString());
        return {
            _id: member._id,
            name: member.name,
            position: member.position,
            tasks: {
                todo: memberStats.find(s => s._id.status === 'todo')?.count || 0,
                inProgress: memberStats.find(s => s._id.status === 'in-progress')?.count || 0,
                review: memberStats.find(s => s._id.status === 'review')?.count || 0,
                done: memberStats.find(s => s._id.status === 'done')?.count || 0,
            }
        };
    });

    // 2. Real-time Graph Data (Productivity & Efficiency)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all tasks created OR completed today for the team
    const dailyTasks = await Task.find({
        employee: { $in: memberIds },
        $or: [
            { createdAt: { $gte: today } },
            { completedAt: { $gte: today } }
        ]
    });

    // Time slots: 09:00, 11:00, 13:00, 15:00, 17:00
    const timeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00'];
    
    // Productivity Flow: Input (Assigned) vs Output (Done)
    const productivityFlow = timeSlots.map(time => {
        const hour = parseInt(time.split(':')[0] || '0');
        const input = dailyTasks.filter(t => {
            const tHour = new Date(t.createdAt as any).getHours();
            return tHour >= hour - 2 && tHour < hour;
        }).length;

        const output = dailyTasks.filter(t => {
            if (!t.completedAt) return false;
            const tHour = new Date(t.completedAt as any).getHours();
            return tHour >= hour - 2 && tHour < hour;
        }).length;

        return { time, input, output };
    });

    // Efficiency Metrics: Efficiency vs Errors
    // Errors are simulated as tasks in 'review' or past due
    const efficiencyMetrics = timeSlots.map((time, idx) => {
        const hour = parseInt(time.split(':')[0] || '0');
        const totalActive = dailyTasks.filter(t => new Date(t.createdAt as any).getHours() < hour).length;
        const totalDone = dailyTasks.filter(t => t.completedAt && new Date(t.completedAt as any).getHours() < hour).length;
        
        const efficiency = totalActive > 0 ? (totalDone / totalActive) * 100 : 0; 
        const errors = dailyTasks.filter(t => t.status === 'review' && new Date(t.updatedAt as any).getHours() < hour).length;

        return { time, efficiency: Math.min(efficiency, 100), errors };
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
            members: teamAnalytics,
            graphs: {
                productivityFlow,
                efficiencyMetrics
            },
            totals: {
                done: taskStats.filter(s => s._id.status === 'done').reduce((acc, curr) => acc + curr.count, 0),
                pending: taskStats.filter(s => s._id.status !== 'done').reduce((acc, curr) => acc + curr.count, 0)
            }
        }
    });
});

export default {
    getMyPerformance,
    getEmployeePerformance,
    updateActivity,
    getTeamIntelligence
};
