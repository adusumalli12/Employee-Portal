import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'task_assigned' | 'task_completed' | 'leave_requested' | 'leave_approved' | 'leave_rejected' | 'user_registered' | 'system_update';
    relatedId?: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['task_assigned', 'task_completed', 'leave_requested', 'leave_approved', 'leave_rejected', 'user_registered', 'system_update'],
        required: true
    },
    relatedId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Post-save hook to emit real-time notification
NotificationSchema.post('save', async function(doc: any) {
    try {
        const { emitNotification } = await import('../utils/socket');
        emitNotification(doc.recipient.toString(), doc);
    } catch (err) {
        console.error('Error emitting real-time notification:', err);
    }
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
