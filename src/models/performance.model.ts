import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformance extends Document {
    employee: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    score: number; // 0-100
    metrics: {
        tasksCompleted: number;
        accuracy: number; // 0-1
        speed: number; // 0-1
        quality: number; // 0-1
    };
    activityLog: {
        time: Date;
        action: string;
        value: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const PerformanceSchema: Schema = new Schema({
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    score: { type: Number, default: 0 },
    metrics: {
        tasksCompleted: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        speed: { type: Number, default: 0 },
        quality: { type: Number, default: 0 }
    },
    activityLog: [{
        time: { type: Date, default: Date.now },
        action: { type: String },
        value: { type: Number }
    }]
}, { timestamps: true });

// Ensure unique entry per employee per day
PerformanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export const Performance = mongoose.model<IPerformance>('Performance', PerformanceSchema);
