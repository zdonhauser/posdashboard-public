/**
 * Employee Routes
 *
 * Defines HTTP routes for employee management, clock entries, and recurring entries.
 */

import { Router } from 'express';
import * as employeeController from '../controllers/employeeController';

// Routes that DON'T require JWT authentication
export const employeePublicRoutes = Router();

// GET /api/employee/:code - Employee login (no JWT required)
employeePublicRoutes.get('/employee/:code', employeeController.getEmployeeByCode);

// Routes that REQUIRE JWT authentication
const router = Router();

/**
 * Recurring Entry Routes
 */

// GET /api/recurring-entries - Get recurring entries
router.get('/recurring-entries', employeeController.getRecurringEntries);

// POST /api/recurring-entries - Create a recurring entry
router.post('/recurring-entries', employeeController.createRecurringEntry);

// PUT /api/recurring-entries/:id - Update a recurring entry
router.put('/recurring-entries/:id', employeeController.updateRecurringEntry);

// DELETE /api/recurring-entries/:id - Delete a recurring entry
router.delete('/recurring-entries/:id', employeeController.deleteRecurringEntry);

/**
 * Employee Routes
 */

// GET /api/employees - Get all employees
router.get('/employees', employeeController.getAllEmployees);

// GET /api/search-employees - Search employees
router.get('/search-employees', employeeController.searchEmployees);

// PUT /api/employee/:id/activate - Activate an employee
router.put('/employee/:id/activate', employeeController.activateEmployee);

// PUT /api/employee/:id - Update an employee
router.put('/employee/:id', employeeController.updateEmployee);

// POST /api/employee - Create a new employee
router.post('/employee', employeeController.createEmployee);

/**
 * Clock Entry Routes
 */

// POST /api/employee/:id/clock - Create a clock entry
router.post('/employee/:id/clock', employeeController.createClockEntry);

// PATCH /api/employee/clock/:clockEntryId - Update a clock entry
router.patch('/employee/clock/:clockEntryId', employeeController.updateClockEntry);

// GET /api/clock-entries - Get clock entries
router.get('/clock-entries', employeeController.getClockEntries);

// DELETE /api/clock-entries/:id - Delete a clock entry
router.delete('/clock-entries/:id', employeeController.deleteClockEntry);

export default router;
