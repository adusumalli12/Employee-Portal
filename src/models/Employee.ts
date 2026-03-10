import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { IEmployee, IEmployeeModel } from '../types/models';

const employeeSchema = new Schema<IEmployee, IEmployeeModel>(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Please enter a valid email address'],
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    phoneNumber: {
      type: String,
      default: null,
      match: [
        /^\+?[1-9]\d{1,14}$/,
        'Please enter a valid phone number in E.164 format (e.g., +1234567890)',
      ],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },

    // Authentication Fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpiry: {
      type: Date,
      default: null,
    },

    // Password Reset Fields
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpiry: {
      type: Date,
      default: null,
    },

    // OTP Verification Fields
    otpMethod: {
      type: String,
      enum: ['email', 'sms'],
      default: null,
    },
    otp: {
      type: String,
      default: null,
      select: false, // Don't return by default in queries (security)
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpContext: {
      type: String,
      enum: ['signup', 'forgot-password', 'email-verification', 'password-change'],
      default: null,
    },

    // Phone Number Verification
    phoneNumberVerified: {
      type: Boolean,
      default: false,
    },

    // User Role
    role: {
      type: String,
      enum: ['user', 'manager', 'admin', 'superadmin'],
      default: 'user',
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash password
employeeSchema.pre('save', async function preSaveHashPassword() {
  if (!this.isModified('password')) return;
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// Pre-update middleware to hash password on updates
employeeSchema.pre(['findOneAndUpdate', 'updateOne'], async function preUpdateHashPassword() {
  const update = this.getUpdate() as any;
  if (!update) return;

  const $set = update.$set || {};
  const newPassword = $set.password ?? update.password;

  if (!newPassword) return;

  const saltRounds = 10;
  const hashed = await bcrypt.hash(newPassword, saltRounds);

  if (update.password) {
    update.password = hashed;
  }
  if ($set.password) {
    $set.password = hashed;
    update.$set = $set;
  }
  this.setUpdate(update);
});

// Instance method to compare password
employeeSchema.methods.comparePassword = function (
  this: IEmployee,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Employee = model<IEmployee, IEmployeeModel>('Employee', employeeSchema);

export default Employee;
