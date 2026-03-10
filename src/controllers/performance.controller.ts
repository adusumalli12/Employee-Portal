import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Performance } from '../models/Performance';
import { Task } from '../models/Task';
import { Employee } from '../models/Employee';
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

    const today = new Date().toISOString().split('T')[0];

    // Get or create today's performance record
    let perf = await Performance.findOne({ employee: req.user.id, date: today });
    if (!perf) {
        perf = await Performance.create({
            employee: req.user.id,
            date: today,
            score: 75, // Starting base
            metrics: { tasksCompleted: 0, accuracy: 0.8, speed: 0.7, quality: 0.9 }
        });
    }

    // Get tasks for flowchart
    const tasks = await Task.find({ employee: req.user.id }).sort({ updatedAt: -1 });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        performance: perf,
        tasks,
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

    // 1. Get all employees managed by this user
    const teamMembers = await Employee.find({ managerId: req.user.id }).select('name position');

    // 2. Aggregate tasks for these employees
    const memberIds = teamMembers.map(m => m._id);

    // Get task counts per status for each member
    const taskStats = await Task.aggregate([
        { $match: { employee: { $in: memberIds } } },
        {
            $group: {
                _id: { employee: "$employee", status: "$status" },
                count: { $sum: 1 }
            }
        }
    ]);

    // Format the data for frontend
    const teamIntelligence = teamMembers.map(member => {
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

    // 3. Overall team totals
    const totals = {
        done: taskStats.filter(s => s._id.status === 'done').reduce((acc, curr) => acc + curr.count, 0),
        pending: taskStats.filter(s => s._id.status !== 'done').reduce((acc, curr) => acc + curr.count, 0)
    };

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
            members: teamIntelligence,
            totals
        }
    });
});

export default {
    getMyPerformance,
    getEmployeePerformance,
    updateActivity,
    getTeamIntelligence
};
