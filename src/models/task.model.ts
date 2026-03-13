import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description: string;
    employee: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'review', 'done'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    dueDate: { type: Date },
    completedAt: { type: Date }
}, { timestamps: true });

// TTL Index: Delete completed tasks after 72 hours (259200 seconds)
TaskSchema.index({ completedAt: 1 }, { expireAfterSeconds: 259200 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
