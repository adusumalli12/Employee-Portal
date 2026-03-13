import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Leave } from '../models/leave.model';
import { Employee } from '../models/employee.model';
import { Notification } from '../models/notification.model';
import { HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';
import { emitNotification } from '../utils/socket';
import EmailService from '../services/email.service';

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

    const employee = await Employee.findById(employeeId);
    if (!employee) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Employee not found' });
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

    // Create Notification for Manager
    if (employee.managerId) {
        const manager = await Employee.findById(employee.managerId);
        if (manager) {
            const notificationTitle = 'New Leave Request';
            const notificationMessage = `${employee.name} has requested ${type} leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`;

            const notification = await Notification.create({
                recipient: employee.managerId,
                sender: employeeId,
                title: notificationTitle,
                message: notificationMessage,
                type: 'leave_requested',
                relatedId: leave._id
            });

            // Emit real-time notification
            emitNotification(employee.managerId.toString(), notification);

            // Send Email to Manager
            await EmailService.sendLeaveRequestedEmail(
                manager.email,
                manager.name,
                employee.name,
                type,
                new Date(startDate),
                new Date(endDate)
            );
        }
    }

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
    const managerId = req.user?.id;

    if (!['approved', 'rejected'].includes(status)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid status'
        });
        return;
    }

    const leave = await Leave.findByIdAndUpdate(
        leaveId,
        { 
            status,
            completedAt: new Date()
        },
        { new: true }
    ).populate('employee', 'name email');

    if (!leave) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Leave request not found'
        });
        return;
    }

    const employee = leave.employee as any;
    
    // Create Notification for Employee
    const notificationTitle = `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    const notificationMessage = `Your ${leave.type} leave request from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} has been ${status}.`;

    const notification = await Notification.create({
        recipient: employee._id,
        sender: managerId,
        title: notificationTitle,
        message: notificationMessage,
        type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
        relatedId: leave._id
    });

    // Emit real-time notification
    emitNotification(employee._id.toString(), notification);

    // Send Email to Employee
    await EmailService.sendLeaveStatusEmail(
        employee.email,
        employee.name,
        status,
        leave.type,
        leave.startDate,
        leave.endDate
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Leave request ${status} successfully`,
        data: leave
    });
});

export const cancelLeave = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { leaveId } = req.params;
    const employeeId = req.user?.id;

    const leave = await Leave.findOne({ _id: leaveId, employee: employeeId });

    if (!leave) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Leave request not found or unauthorized'
        });
        return;
    }

    if (leave.status !== 'pending') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Cannot cancel a ${leave.status} leave request`
        });
        return;
    }

    await Leave.findByIdAndDelete(leaveId);

    // Delete associated notification for manager if it exists
    await Notification.deleteMany({ relatedId: leaveId, recipient: { $ne: employeeId } });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Leave request cancelled successfully'
    });
});

export const updateLeave = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { leaveId } = req.params;
    const { type, startDate, endDate, reason } = req.body;
    const employeeId = req.user?.id;

    const leave = await Leave.findOne({ _id: leaveId, employee: employeeId });

    if (!leave) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Leave request not found or unauthorized'
        });
        return;
    }

    if (leave.status !== 'pending') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Cannot edit a ${leave.status} leave request`
        });
        return;
    }

    leave.type = type || leave.type;
    leave.startDate = startDate ? new Date(startDate) : leave.startDate;
    leave.endDate = endDate ? new Date(endDate) : leave.endDate;
    leave.reason = reason || leave.reason;

    await leave.save();

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Leave request updated successfully',
        data: leave
    });
});

export default {
    applyLeave,
    getMyLeaves,
    getTeamLeaves,
    updateLeaveStatus,
    cancelLeave,
    updateLeave
};
