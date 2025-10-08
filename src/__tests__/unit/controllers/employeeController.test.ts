/**
 * Employee Controller Tests
 */

import { Request, Response } from 'express';
import * as employeeController from '../../../controllers/employeeController';
import * as employeeService from '../../../services/employeeService';
import * as authMiddleware from '../../../middleware/auth';
import * as authUtils from '../../../utils/auth';

// Mock dependencies
jest.mock('../../../services/employeeService');
jest.mock('../../../middleware/auth');
jest.mock('../../../utils/auth');

describe('Employee Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });

    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      json: jsonMock,
      send: sendMock,
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  describe('Recurring Entries', () => {
    describe('getRecurringEntries', () => {
      it('should return recurring entries', async () => {
        const mockEntries = [{ id: 1, type: 'bonus', amount: 100 }];
        mockRequest.query = { employee_id: '1', start_date: '2024-01-01', end_date: '2024-12-31' };

        (employeeService.getRecurringEntries as jest.Mock).mockResolvedValue(mockEntries);

        await employeeController.getRecurringEntries(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(employeeService.getRecurringEntries).toHaveBeenCalledWith(
          1,
          '2024-01-01',
          '2024-12-31'
        );
        expect(jsonMock).toHaveBeenCalledWith(mockEntries);
      });

      it('should handle errors', async () => {
        mockRequest.query = {};
        (employeeService.getRecurringEntries as jest.Mock).mockRejectedValue(
          new Error('Database error')
        );

        await employeeController.getRecurringEntries(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' });
      });
    });

    describe('createRecurringEntry', () => {
      it('should create a recurring entry', async () => {
        const mockEntry = { id: 1, type: 'bonus', amount: 100 };
        mockRequest.body = {
          employee_id: 1,
          type: 'bonus',
          amount: 100,
          description: 'Test',
          start_date: '2024-01-01',
        };

        (employeeService.createRecurringEntry as jest.Mock).mockResolvedValue(mockEntry);

        await employeeController.createRecurringEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(jsonMock).toHaveBeenCalledWith(mockEntry);
      });
    });

    describe('updateRecurringEntry', () => {
      it('should update a recurring entry', async () => {
        const mockEntry = { id: 1, type: 'bonus', amount: 150 };
        mockRequest.params = { id: '1' };
        mockRequest.body = {
          type: 'bonus',
          amount: 150,
          description: 'Updated',
          start_date: '2024-01-01',
        };

        (employeeService.updateRecurringEntry as jest.Mock).mockResolvedValue(mockEntry);

        await employeeController.updateRecurringEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(jsonMock).toHaveBeenCalledWith(mockEntry);
      });

      it('should return 404 if entry not found', async () => {
        mockRequest.params = { id: '999' };
        mockRequest.body = { type: 'bonus', amount: 150, description: 'Updated', start_date: '2024-01-01' };

        (employeeService.updateRecurringEntry as jest.Mock).mockResolvedValue(null);

        await employeeController.updateRecurringEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
      });
    });

    describe('deleteRecurringEntry', () => {
      it('should delete a recurring entry', async () => {
        mockRequest.params = { id: '1' };

        (employeeService.deleteRecurringEntry as jest.Mock).mockResolvedValue(true);

        await employeeController.deleteRecurringEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(jsonMock).toHaveBeenCalledWith({ message: 'Recurring entry deleted successfully' });
      });

      it('should return 404 if entry not found', async () => {
        mockRequest.params = { id: '999' };

        (employeeService.deleteRecurringEntry as jest.Mock).mockResolvedValue(false);

        await employeeController.deleteRecurringEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
      });
    });
  });

  describe('Employee Operations', () => {
    describe('getEmployeeByCode', () => {
      beforeEach(() => {
        (authMiddleware.getClientIp as jest.Mock).mockReturnValue('127.0.0.1');
        (authUtils.handleLockout as jest.Mock).mockReturnValue({
          isLockedOut: false,
          remainingLockout: 0,
        });
      });

      it('should return employee with token', async () => {
        const mockEmployee = { id: 1, firstname: 'John', lastname: 'Doe', code: '1234' };
        const mockClockEntries = [{ id: 1, employee_id: 1, clock_in: '2024-01-01T10:00:00Z' }];
        mockRequest.params = { code: '1234' };

        (employeeService.getEmployeeByCode as jest.Mock).mockResolvedValue(mockEmployee);
        (employeeService.getEmployeeClockEntriesForCurrentWeek as jest.Mock).mockResolvedValue(
          mockClockEntries
        );
        (employeeService.generateEmployeeToken as jest.Mock).mockReturnValue('mock-token');

        await employeeController.getEmployeeByCode(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(sendMock).toHaveBeenCalledWith({
          ...mockEmployee,
          token: 'mock-token',
          clockEntries: mockClockEntries,
        });
        expect(authUtils.resetLockout).toHaveBeenCalledWith('127.0.0.1');
      });

      it('should return 403 if IP is locked out', async () => {
        mockRequest.params = { code: '1234' };

        (authUtils.handleLockout as jest.Mock).mockReturnValue({
          isLockedOut: true,
          remainingLockout: 5000,
        });

        await employeeController.getEmployeeByCode(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(403);
      });

      it('should return 400 for invalid code', async () => {
        mockRequest.params = { code: '12' };

        await employeeController.getEmployeeByCode(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
      });

      it('should return 401 for non-existent employee', async () => {
        mockRequest.params = { code: '9999' };

        (employeeService.getEmployeeByCode as jest.Mock).mockResolvedValue(null);

        await employeeController.getEmployeeByCode(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(401);
      });
    });

    describe('getAllEmployees', () => {
      it('should return all employees', async () => {
        const mockEmployees = [
          { id: 1, firstname: 'John', lastname: 'Doe' },
          { id: 2, firstname: 'Jane', lastname: 'Smith' },
        ];

        (employeeService.getAllEmployees as jest.Mock).mockResolvedValue(mockEmployees);

        await employeeController.getAllEmployees(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(sendMock).toHaveBeenCalledWith(mockEmployees);
      });
    });

    describe('activateEmployee', () => {
      it('should activate an employee', async () => {
        mockRequest.params = { id: '1' };

        (employeeService.activateEmployee as jest.Mock).mockResolvedValue(undefined);

        await employeeController.activateEmployee(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(sendMock).toHaveBeenCalledWith({ message: 'Employee activated successfully' });
      });
    });

    describe('updateEmployee', () => {
      it('should update an employee', async () => {
        const mockEmployee = { id: 1, firstname: 'John', lastname: 'Doe', email: 'john@example.com' };
        mockRequest.params = { id: '1' };
        mockRequest.body = { firstname: 'John', email: 'john@example.com' };

        (employeeService.updateEmployee as jest.Mock).mockResolvedValue(mockEmployee);

        await employeeController.updateEmployee(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(sendMock).toHaveBeenCalledWith(mockEmployee);
      });

      it('should return 404 if employee not found', async () => {
        mockRequest.params = { id: '999' };
        mockRequest.body = { firstname: 'John' };

        (employeeService.updateEmployee as jest.Mock).mockResolvedValue(null);

        await employeeController.updateEmployee(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
      });

      it('should return 400 for no valid fields', async () => {
        mockRequest.params = { id: '1' };
        mockRequest.body = {};

        (employeeService.updateEmployee as jest.Mock).mockRejectedValue(
          new Error('No valid fields provided for update')
        );

        await employeeController.updateEmployee(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
      });
    });

    describe('createEmployee', () => {
      it('should create a new employee', async () => {
        const mockEmployee = { id: 1, firstname: 'John', lastname: 'Doe', code: '1234' };
        mockRequest.body = {
          firstname: 'John',
          lastname: 'Doe',
          code: '1234',
        };

        (employeeService.createEmployee as jest.Mock).mockResolvedValue(mockEmployee);

        await employeeController.createEmployee(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(sendMock).toHaveBeenCalledWith(mockEmployee);
      });
    });

    describe('searchEmployees', () => {
      it('should return matching employees', async () => {
        const mockEmployees = [{ id: 1, firstname: 'John', lastname: 'Doe' }];
        mockRequest.query = { query: 'John', active: 'true' };

        (employeeService.searchEmployees as jest.Mock).mockResolvedValue(mockEmployees);

        await employeeController.searchEmployees(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(sendMock).toHaveBeenCalledWith(mockEmployees);
      });

      it('should return 404 if no employees found', async () => {
        mockRequest.query = { query: 'Nonexistent' };

        (employeeService.searchEmployees as jest.Mock).mockResolvedValue([]);

        await employeeController.searchEmployees(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
      });
    });
  });

  describe('Clock Entry Operations', () => {
    describe('createClockEntry', () => {
      it('should create a clock entry', async () => {
        const mockEntry = { id: 1, employee_id: 1, clock_in: '2024-01-01T10:00:00Z', clock_out: null };
        mockRequest.params = { id: '1' };
        mockRequest.body = { clock_in: '2024-01-01T10:00:00Z' };

        (employeeService.createClockEntry as jest.Mock).mockResolvedValue(mockEntry);

        await employeeController.createClockEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(sendMock).toHaveBeenCalledWith({
          message: 'Clock entry created successfully.',
          entry: mockEntry,
        });
      });
    });

    describe('updateClockEntry', () => {
      it('should update a clock entry', async () => {
        const mockEntry = { id: 1, employee_id: 1, clock_in: '2024-01-01T10:00:00Z', clock_out: '2024-01-01T18:00:00Z' };
        mockRequest.params = { clockEntryId: '1' };
        mockRequest.body = { clock_out: '2024-01-01T18:00:00Z' };

        (employeeService.updateClockEntry as jest.Mock).mockResolvedValue(mockEntry);

        await employeeController.updateClockEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(200);
      });

      it('should return 404 if entry not found', async () => {
        mockRequest.params = { clockEntryId: '999' };
        mockRequest.body = { clock_out: '2024-01-01T18:00:00Z' };

        (employeeService.updateClockEntry as jest.Mock).mockResolvedValue(null);

        await employeeController.updateClockEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
      });
    });

    describe('getClockEntries', () => {
      it('should return clock entries', async () => {
        const mockEntries = [
          { clock_entry_id: 1, employee_id: 1, firstname: 'John', lastname: 'Doe' },
        ];
        mockRequest.query = { start: '2024-01-01', end: '2024-01-31', employee_id: '1' };

        (employeeService.getClockEntries as jest.Mock).mockResolvedValue(mockEntries);

        await employeeController.getClockEntries(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(sendMock).toHaveBeenCalledWith(mockEntries);
      });

      it('should return 400 if start or end missing', async () => {
        mockRequest.query = { start: '2024-01-01' };

        await employeeController.getClockEntries(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
      });
    });

    describe('deleteClockEntry', () => {
      it('should delete a clock entry', async () => {
        mockRequest.params = { id: '1' };

        (employeeService.deleteClockEntry as jest.Mock).mockResolvedValue(true);

        await employeeController.deleteClockEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(jsonMock).toHaveBeenCalledWith({ message: 'Clock entry deleted successfully' });
      });

      it('should return 404 if entry not found', async () => {
        mockRequest.params = { id: '999' };

        (employeeService.deleteClockEntry as jest.Mock).mockResolvedValue(false);

        await employeeController.deleteClockEntry(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
      });
    });
  });
});
