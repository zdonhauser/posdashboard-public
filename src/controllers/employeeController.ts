/**
 * Employee Controller
 *
 * Handles HTTP requests for employee management, clock entries, and recurring entries.
 */

import { Request, Response } from 'express';
import * as employeeService from '../services/employeeService';
import { getClientIp } from '../middleware/auth';
import { handleLockout, resetLockout } from '../utils/auth';

/**
 * Recurring Entry Controllers
 */

export async function getRecurringEntries(req: Request, res: Response): Promise<void> {
  try {
    const { employee_id, start_date, end_date } = req.query;
    const employeeId = employee_id ? parseInt(employee_id as string) : undefined;

    const entries = await employeeService.getRecurringEntries(
      employeeId,
      start_date as string,
      end_date as string
    );

    res.json(entries);
  } catch (error) {
    console.error('Error fetching recurring entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createRecurringEntry(req: Request, res: Response): Promise<void> {
  try {
    const { employee_id, type, amount, description, start_date, end_date } = req.body;

    const entry = await employeeService.createRecurringEntry({
      employee_id,
      type,
      amount,
      description,
      start_date,
      end_date,
    });

    res.json(entry);
  } catch (error) {
    console.error('Error creating recurring entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateRecurringEntry(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { type, amount, description, start_date, end_date } = req.body;

    const entry = await employeeService.updateRecurringEntry(parseInt(id), {
      type,
      amount,
      description,
      start_date,
      end_date,
    });

    if (!entry) {
      res.status(404).json({ error: 'Recurring entry not found' });
      return;
    }

    res.json(entry);
  } catch (error) {
    console.error('Error updating recurring entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteRecurringEntry(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await employeeService.deleteRecurringEntry(parseInt(id));

    if (!deleted) {
      res.status(404).json({ error: 'Recurring entry not found' });
      return;
    }

    res.json({ message: 'Recurring entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Employee Controllers
 */

export async function getEmployeeByCode(req: Request, res: Response): Promise<void> {
  const { code } = req.params;
  const ip = getClientIp(req);

  // Check lockout status
  const { isLockedOut, remainingLockout } = handleLockout(ip);

  if (isLockedOut) {
    res.status(403).send({
      error: `Too many failed attempts. Try again in ${Math.ceil(
        remainingLockout / 1000
      )} second(s).`,
    });
    return;
  }

  if (!code || code.length !== 4) {
    res.status(400).send('A valid 4-digit code is required');
    return;
  }

  try {
    const employee = await employeeService.getEmployeeByCode(code);

    if (!employee) {
      res.status(401).send({ error: 'Invalid code' });
      return;
    }

    const clockEntries = await employeeService.getEmployeeClockEntriesForCurrentWeek(
      employee.id
    );

    // Clear login attempts
    resetLockout(ip);

    // Generate JWT token
    const token = employeeService.generateEmployeeToken(employee.id);

    res.send({
      ...employee,
      token,
      clockEntries,
    });
  } catch (error) {
    console.error('Error signing in employee:', error);
    res.status(500).send({ error: 'Server error' });
  }
}

export async function getAllEmployees(req: Request, res: Response): Promise<void> {
  try {
    const employees = await employeeService.getAllEmployees();
    res.send(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).send({ error: 'Server error' });
  }
}

export async function activateEmployee(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    await employeeService.activateEmployee(parseInt(id));
    res.send({ message: 'Employee activated successfully' });
  } catch (error) {
    console.error('Error activating employee:', error);
    res.status(500).send({ error: 'Server error' });
  }
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const updatedEmployee = req.body;

  try {
    const employee = await employeeService.updateEmployee(
      parseInt(id),
      updatedEmployee
    );

    if (!employee) {
      res.status(404).send({ error: 'Employee not found' });
      return;
    }

    res.send(employee);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No valid fields')) {
      res.status(400).send({ error: error.message });
      return;
    }
    console.error('Error updating employee:', error);
    res.status(500).send({ error: 'Server error' });
  }
}

export async function createEmployee(req: Request, res: Response): Promise<void> {
  const newEmployee = req.body;
  try {
    const employee = await employeeService.createEmployee(newEmployee);
    res.status(201).send(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).send({ error: 'Server error' });
  }
}

export async function searchEmployees(req: Request, res: Response): Promise<void> {
  const { query, active } = req.query;

  try {
    const employees = await employeeService.searchEmployees(
      query as string,
      active as 'true' | 'false' | undefined
    );

    if (employees.length === 0) {
      res.status(404).send({ error: 'No employees found' });
      return;
    }

    res.send(employees);
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).send({ error: 'Server error' });
  }
}

/**
 * Clock Entry Controllers
 */

export async function createClockEntry(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { clock_in, clock_out } = req.body;

  try {
    const entry = await employeeService.createClockEntry(
      parseInt(id),
      clock_in,
      clock_out
    );

    res.status(201).send({
      message: 'Clock entry created successfully.',
      entry,
    });
  } catch (error) {
    console.error('Error adding clock entry:', error);
    res.status(500).send({ error: 'Server error.' });
  }
}

export async function updateClockEntry(req: Request, res: Response): Promise<void> {
  const { clockEntryId } = req.params;
  const { clock_in, clock_out } = req.body;

  try {
    const entry = await employeeService.updateClockEntry(
      parseInt(clockEntryId),
      clock_in,
      clock_out
    );

    if (!entry) {
      res.status(404).send({ error: 'Clock entry not found.' });
      return;
    }

    res.status(200).send({
      message: 'Clock entry updated successfully.',
      entry,
    });
  } catch (error) {
    console.error('Error updating clock entry:', error);
    res.status(500).send({ error: 'Server error.' });
  }
}

export async function getClockEntries(req: Request, res: Response): Promise<void> {
  try {
    const { start, end, employee_id } = req.query;

    if (!start || !end) {
      res.status(400).send({ error: "Both 'start' and 'end' query params are required." });
      return;
    }

    const employeeId = employee_id ? Number(employee_id) : undefined;
    const entries = await employeeService.getClockEntries(
      start as string,
      end as string,
      employeeId
    );

    res.status(200).send(entries);
  } catch (error) {
    console.error('Error fetching clock entries:', error);
    res.status(500).send({ error: 'Server error fetching clock entries.' });
  }
}

export async function deleteClockEntry(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const deleted = await employeeService.deleteClockEntry(parseInt(id));

    if (!deleted) {
      res.status(404).send({ message: 'Clock entry not found' });
      return;
    }

    res.json({ message: 'Clock entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting clock entry:', error);
    res.status(500).json({ message: 'Error deleting clock entry' });
  }
}
