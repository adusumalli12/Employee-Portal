import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as twilioController from '../controllers/twilio.controller';

const router = Router();

// ===========================
// Protected Routes (All require authentication)
// ===========================

// Send SMS
router.post('/send-sms', authenticateToken, asyncHandler(twilioController.sendSMS));

// Get SMS Status
router.get('/sms-status/:messageSid', authenticateToken, asyncHandler(twilioController.getSMSStatus));

export default router;
