import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
    employee: mongoose.Types.ObjectId;
    type: 'sick' | 'vacation' | 'personal' | 'other';
    startDate: Date;
    endDate: Date;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    completedAt?: Date;
    appliedAt: Date;
    updatedAt: Date;
}

const LeaveSchema: Schema = new Schema({
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
        type: String,
        enum: ['sick', 'vacation', 'personal', 'other'],
        default: 'personal'
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    completedAt: { type: Date }
}, { timestamps: true });

// TTL Index: Delete completed leave requests after 72 hours
LeaveSchema.index({ completedAt: 1 }, { expireAfterSeconds: 259200 });

export const Leave = mongoose.model<ILeave>('Leave', LeaveSchema);
