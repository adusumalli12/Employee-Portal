import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Employee } from '../models/Employee';
import { HTTP_STATUS, ResponseMessages } from '../utils/constants';

/**
 * Employee Controller
 * Functional implementation for managing employee records
 */

export async function getAllEmployees(req: AuthRequest, res: Response): Promise<void> {
  try {
    const employees = await Employee.find().select('-password');
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Employees fetched successfully',
      data: employees,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch employees',
    });
  }
}

export async function getEmployeeById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const employee = await Employee.findById(req.params.id).select('-password');
    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ResponseMessages.USER_NOT_FOUND,
      });
      return;
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch employee',
    });
  }
}

export async function addEmployee(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, company, location, position, salary, experience, phoneNumber } = req.body;

  if (!name || !email || !company || !location || !position || salary === undefined || experience === undefined) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'All fields are required',
    });
    return;
  }

  try {
    const existingUser = await Employee.findOne({ email });
    if (existingUser) {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ResponseMessages.USER_ALREADY_EXISTS,
      });
      return;
    }

    // Creating with a random password since one wasn't provided in the guide's example
    const password = Math.random().toString(36).slice(-10) + '!1Aa';

    const employee = new Employee({
      name,
      email,
      password,
      company,
      location,
      position,
      salary,
      experience,
      phoneNumber,
      isEmailVerified: true, // Admin created employees are pre-verified for testing
    });

    await employee.save();

    const userData = employee.toObject();
    delete (userData as any).password;

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Employee added successfully',
      data: userData,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to add employee',
    });
  }
}

export async function updateEmployee(req: AuthRequest, res: Response): Promise<void> {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ResponseMessages.USER_NOT_FOUND,
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: ResponseMessages.USER_UPDATE_SUCCESS,
      data: employee,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to update employee',
    });
  }
}

export async function deleteEmployee(req: AuthRequest, res: Response): Promise<void> {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ResponseMessages.USER_NOT_FOUND,
      });
      return;
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: ResponseMessages.USER_DELETE_SUCCESS,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to delete employee',
    });
  }
}

export async function getEmployeeStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const stats = await Employee.aggregate([
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          averageSalary: { $avg: '$salary' },
          totalSalary: { $sum: '$salary' },
          averageExperience: { $avg: '$experience' },
        },
      },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats[0] || {
        totalEmployees: 0,
        averageSalary: 0,
        totalSalary: 0,
        averageExperience: 0,
      },
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch stats',
    });
  }
}

export async function getPendingManagers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const managers = await Employee.find({
      role: 'manager',
      isApproved: false,
    } as any).select('-password');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: managers,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch pending managers',
    });
  }
}

export async function approveManager(req: AuthRequest, res: Response): Promise<void> {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ResponseMessages.USER_NOT_FOUND,
      });
      return;
    }

    if (employee.role !== 'manager') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Only manager roles can be approved via this endpoint',
      });
      return;
    }

    employee.isApproved = true;
    await employee.save();

    // Notify manager that they are approved
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Manager approved successfully',
      data: { id: employee._id, name: employee.name, role: employee.role, isApproved: true },
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to approve manager',
    });
  }
}

export async function getTeamMembers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const managerId = req.user?.id;
    const members = await Employee.find({ managerId: managerId as any }).select('-password');
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch team members',
    });
  }
}

export async function addToTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { employeeId } = req.body;
    const managerId = req.user?.id;

    if (!employeeId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Employee ID is required' });
      return;
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { managerId: managerId as any },
      { new: true }
    ).select('-password');

    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Employee not found' });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Employee added to team successfully',
      data: employee,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to add employee to team',
    });
  }
}

export async function removeFromTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { employeeId } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { managerId: null },
      { new: true }
    ).select('-password');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Employee removed from team',
      data: employee,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to remove from team',
    });
  }
}

export default {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getPendingManagers,
  approveManager,
  getTeamMembers,
  addToTeam,
  removeFromTeam,
};
