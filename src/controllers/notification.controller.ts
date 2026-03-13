import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Notification } from '../models/notification.model';
import { HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

export const getMyNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const recipientId = req.user?.id;
    // We only fetch unread notifications because read ones are meant to be "deleted"
    const notifications = await Notification.find({ recipient: recipientId, isRead: false })
        .sort({ createdAt: -1 })
        .limit(20);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: notifications
    });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { notificationId } = req.params;
    // Instead of just marking as read, we delete it to fulfill the "auto-delete" requirement
    await Notification.findByIdAndDelete(notificationId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notification deleted successfully'
    });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const recipientId = req.user?.id;
    // Delete all unread notifications for this user
    await Notification.deleteMany({ recipient: recipientId });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'All notifications cleared'
    });
});

export default {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
