import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Notification } from '../models/Notification';
import { HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

export const getMyNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const recipientId = req.user?.id;
    const notifications = await Notification.find({ recipient: recipientId })
        .sort({ createdAt: -1 })
        .limit(20);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: notifications
    });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notification marked as read'
    });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const recipientId = req.user?.id;
    await Notification.updateMany({ recipient: recipientId, isRead: false }, { isRead: true });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'All notifications marked as read'
    });
});

export default {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
