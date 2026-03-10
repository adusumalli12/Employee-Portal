import { Schema, model } from 'mongoose';
import { IAttendance, IAttendanceModel } from '../types/models';

const attendanceSchema = new Schema<IAttendance, IAttendanceModel>(
    {
        employee: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
        },
        checkIn: {
            type: Date,
            required: true,
            default: Date.now,
        },
        checkOut: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['working', 'completed', 'on-break'],
            default: 'working',
        },
        totalSeconds: {
            type: Number,
            default: 0,
        },
        date: {
            type: String,
            required: true,
            // Default to current date in YYYY-MM-DD format
            default: () => new Date().toISOString().split('T')[0],
        },
    },
    { timestamps: true }
);

// Index for faster queries by employee and date
attendanceSchema.index({ employee: 1, date: 1 });

export const Attendance = model<IAttendance, IAttendanceModel>('Attendance', attendanceSchema);

export default Attendance;
