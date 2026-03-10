import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Leave } from '../models/Leave';
import { Employee } from '../models/Employee';
import { HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Leave Controller
 * Handles creation, approval, and listing of leave requests
 */

export const applyLeave = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { type, startDate, endDate, reason } = req.body;
    const employeeId = req.user?.id;

    if (!type || !startDate || !endDate || !reason) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'All fields are required'
        });
        return;
    }

    const leave = await Leave.create({
        employee: employeeId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'pending'
    });

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Leave request submitted successfully',
        data: leave
    });
});

export const getMyLeaves = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.id;
    const leaves = await Leave.find({ employee: employeeId }).sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: leaves
    });
});

export const getTeamLeaves = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const managerId = req.user?.id;

    // Get all employees for this manager
    const teamMembers = await Employee.find({ managerId }).select('_id');
    const memberIds = teamMembers.map(m => m._id);

    const leaves = await Leave.find({ employee: { $in: memberIds } })
        .populate('employee', 'name position email')
        .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: leaves
    });
});

export const updateLeaveStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid status'
        });
        return;
    }

    const leave = await Leave.findByIdAndUpdate(
        leaveId,
        { status },
        { new: true }
    ).populate('employee', 'name email');

    if (!leave) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Leave request not found'
        });
        return;
    }

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Leave request ${status} successfully`,
        data: leave
    });
});

export default {
    applyLeave,
    getMyLeaves,
    getTeamLeaves,
    updateLeaveStatus
};
