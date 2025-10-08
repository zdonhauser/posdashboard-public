/**
 * Employee Service Tests
 */

import * as employeeService from '../../../services/employeeService';
import * as database from '../../../config/database';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../../config/database');
jest.mock('jsonwebtoken');

describe('Employee Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Recurring Entries', () => {
    describe('getRecurringEntries', () => {
      it('should fetch recurring entries with filters', async () => {
        const mockEntries = [
          { id: 1, employee_id: 1, type: 'bonus', amount: 100 },
          { id: 2, employee_id: 1, type: 'deduction', amount: 50 },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockEntries });

        const result = await employeeService.getRecurringEntries(1, '2024-01-01', '2024-12-31');

        expect(database.queryDB).toHaveBeenCalled();
        expect(result).toEqual(mockEntries);
      });
    });

    describe('createRecurringEntry', () => {
      it('should create a recurring entry', async () => {
        const mockEntry = { id: 1, employee_id: 1, type: 'bonus', amount: 100 };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockEntry] });

        const result = await employeeService.createRecurringEntry({
          employee_id: 1,
          type: 'bonus',
          amount: 100,
          description: 'Test bonus',
          start_date: '2024-01-01',
        });

        expect(result).toEqual(mockEntry);
      });
    });

    describe('updateRecurringEntry', () => {
      it('should update a recurring entry', async () => {
        const mockEntry = { id: 1, employee_id: 1, type: 'bonus', amount: 150 };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockEntry] });

        const result = await employeeService.updateRecurringEntry(1, {
          type: 'bonus',
          amount: 150,
          description: 'Updated bonus',
          start_date: '2024-01-01',
        });

        expect(result).toEqual(mockEntry);
      });

      it('should return null if entry not found', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await employeeService.updateRecurringEntry(999, {
          type: 'bonus',
          amount: 150,
          description: 'Updated bonus',
          start_date: '2024-01-01',
        });

        expect(result).toBeNull();
      });
    });

    describe('deleteRecurringEntry', () => {
      it('should delete a recurring entry', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

        const result = await employeeService.deleteRecurringEntry(1);

        expect(result).toBe(true);
      });

      it('should return false if entry not found', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await employeeService.deleteRecurringEntry(999);

        expect(result).toBe(false);
      });
    });
  });

  describe('Employee Operations', () => {
    describe('getEmployeeByCode', () => {
      it('should fetch employee by code', async () => {
        const mockEmployee = { id: 1, firstname: 'John', lastname: 'Doe', code: '1234' };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockEmployee] });

        const result = await employeeService.getEmployeeByCode('1234');

        expect(result).toEqual(mockEmployee);
      });

      it('should return null if employee not found', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await employeeService.getEmployeeByCode('9999');

        expect(result).toBeNull();
      });
    });

    describe('generateEmployeeToken', () => {
      it('should generate JWT token for employee', () => {
        (jwt.sign as jest.Mock).mockReturnValue('mock-token');

        const token = employeeService.generateEmployeeToken(1);

        expect(jwt.sign).toHaveBeenCalledWith(
          { name: 1 },
          expect.any(String),
          { expiresIn: '24h' }
        );
        expect(token).toBe('mock-token');
      });
    });

    describe('getAllEmployees', () => {
      it('should fetch all employees', async () => {
        const mockEmployees = [
          { id: 1, firstname: 'John', lastname: 'Doe' },
          { id: 2, firstname: 'Jane', lastname: 'Smith' },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockEmployees });

        const result = await employeeService.getAllEmployees();

        expect(result).toEqual(mockEmployees);
      });
    });

    describe('activateEmployee', () => {
      it('should activate an employee', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

        await employeeService.activateEmployee(1);

        expect(database.queryDB).toHaveBeenCalledWith(
          'UPDATE employees SET active = true WHERE id = $1',
          [1]
        );
      });
    });

    describe('updateEmployee', () => {
      it('should update employee fields', async () => {
        const mockEmployee = { id: 1, firstname: 'John', lastname: 'Doe', email: 'john@example.com' };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockEmployee], rowCount: 1 });

        const result = await employeeService.updateEmployee(1, {
          firstname: 'John',
          email: 'john@example.com',
        } as any);

        expect(result).toEqual(mockEmployee);
      });

      it('should return null if employee not found', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

        const result = await employeeService.updateEmployee(999, { firstname: 'John' } as any);

        expect(result).toBeNull();
      });

      it('should throw error if no valid fields provided', async () => {
        await expect(employeeService.updateEmployee(1, {})).rejects.toThrow(
          'No valid fields provided for update'
        );
      });
    });

    describe('createEmployee', () => {
      it('should create a new employee', async () => {
        const mockEmployee = { id: 1, firstname: 'John', lastname: 'Doe', code: '1234' };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockEmployee] });

        const result = await employeeService.createEmployee({
          firstname: 'John',
          lastname: 'Doe',
          code: '1234',
        });

        expect(result).toEqual(mockEmployee);
      });
    });

    describe('searchEmployees', () => {
      it('should search employees by query', async () => {
        const mockEmployees = [{ id: 1, firstname: 'John', lastname: 'Doe' }];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockEmployees });

        const result = await employeeService.searchEmployees('John');

        expect(result).toEqual(mockEmployees);
      });

      it('should filter by active status', async () => {
        const mockEmployees = [{ id: 1, firstname: 'John', lastname: 'Doe', active: true }];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockEmployees });

        const result = await employeeService.searchEmployees('John', 'true');

        expect(result).toEqual(mockEmployees);
      });
    });
  });

  describe('Clock Entry Operations', () => {
    describe('createClockEntry', () => {
      it('should create a clock entry', async () => {
        const mockEntry = { id: 1, employee_id: 1, clock_in: '2024-01-01T10:00:00Z', clock_out: null };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockEntry] });

        const result = await employeeService.createClockEntry(1, '2024-01-01T10:00:00Z');

        expect(result).toEqual(mockEntry);
      });

      it('should use current time if no clock_in provided', async () => {
        const mockEntry = { id: 1, employee_id: 1, clock_in: expect.any(String), clock_out: null };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockEntry] });

        await employeeService.createClockEntry(1);

        expect(database.queryDB).toHaveBeenCalled();
      });
    });

    describe('updateClockEntry', () => {
      it('should update clock entry', async () => {
        const mockEntry = { id: 1, employee_id: 1, clock_in: '2024-01-01T10:00:00Z', clock_out: '2024-01-01T18:00:00Z' };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockEntry] });

        const result = await employeeService.updateClockEntry(1, undefined, '2024-01-01T18:00:00Z');

        expect(result).toEqual(mockEntry);
      });

      it('should return null if entry not found', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await employeeService.updateClockEntry(999, undefined, '2024-01-01T18:00:00Z');

        expect(result).toBeNull();
      });

      it('should set clock_out to now if neither parameter provided', async () => {
        const mockEntry = { id: 1, employee_id: 1, clock_in: '2024-01-01T10:00:00Z', clock_out: expect.any(String) };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockEntry] });

        await employeeService.updateClockEntry(1);

        expect(database.queryDB).toHaveBeenCalled();
      });
    });

    describe('getClockEntries', () => {
      it('should fetch clock entries', async () => {
        const mockEntries = [
          { clock_entry_id: 1, employee_id: 1, firstname: 'John', lastname: 'Doe' },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockEntries });

        const result = await employeeService.getClockEntries('2024-01-01', '2024-01-31');

        expect(result).toEqual(mockEntries);
      });

      it('should filter by employee_id if provided', async () => {
        const mockEntries = [
          { clock_entry_id: 1, employee_id: 1, firstname: 'John', lastname: 'Doe' },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockEntries });

        await employeeService.getClockEntries('2024-01-01', '2024-01-31', 1);

        expect(database.queryDB).toHaveBeenCalled();
      });
    });

    describe('deleteClockEntry', () => {
      it('should delete a clock entry', async () => {
        (database.pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

        const result = await employeeService.deleteClockEntry(1);

        expect(result).toBe(true);
      });

      it('should return false if entry not found', async () => {
        (database.pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

        const result = await employeeService.deleteClockEntry(999);

        expect(result).toBe(false);
      });
    });
  });
});
