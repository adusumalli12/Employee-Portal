import express from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, notificationController.getMyNotifications);
router.put('/:notificationId/read', authenticateToken, notificationController.markAsRead);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

export default router;
