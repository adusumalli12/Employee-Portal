import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'task_assigned' | 'task_completed' | 'leave_requested' | 'leave_approved' | 'leave_rejected';
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
        enum: ['task_assigned', 'task_completed', 'leave_requested', 'leave_approved', 'leave_rejected'],
        required: true
    },
    relatedId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
