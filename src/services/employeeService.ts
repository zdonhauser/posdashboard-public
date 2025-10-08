/**
 * Employee Service
 *
 * Business logic for employee management, clock entries, and recurring entries.
 */

import { queryDB, pool } from '../config/database';
import { Employee, ClockEntry, RecurringEntry } from '../types/database';
import jwt from 'jsonwebtoken';

/**
 * Recurring Entry Operations
 */

export async function getRecurringEntries(
  employeeId?: number,
  startDate?: string,
  endDate?: string
): Promise<RecurringEntry[]> {
  const query = `
    SELECT * FROM recurring_entries
    WHERE ($1::integer IS NULL OR employee_id = $1)
    AND start_date <= $2::date
    AND (end_date IS NULL OR end_date >= $3::date)
  `;

  const values = [
    employeeId || null,
    endDate || new Date().toISOString().split('T')[0],
    startDate || new Date().toISOString().split('T')[0],
  ];

  const result = await queryDB(query, values);
  return result.rows;
}

export async function createRecurringEntry(data: {
  employee_id: number;
  type: string;
  amount: number;
  description: string;
  start_date: string;
  end_date?: string;
}): Promise<RecurringEntry> {
  const query = `
    INSERT INTO recurring_entries
    (employee_id, type, amount, description, start_date, end_date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [
    data.employee_id,
    data.type,
    data.amount,
    data.description,
    data.start_date,
    data.end_date || null,
  ];
  const result = await queryDB(query, values);
  return result.rows[0];
}

export async function updateRecurringEntry(
  id: number,
  data: {
    type: string;
    amount: number;
    description: string;
    start_date: string;
    end_date?: string;
  }
): Promise<RecurringEntry | null> {
  const query = `
    UPDATE recurring_entries
    SET type = $1, amount = $2, description = $3, start_date = $4, end_date = $5
    WHERE id = $6
    RETURNING *
  `;
  const values = [
    data.type,
    data.amount,
    data.description,
    data.start_date,
    data.end_date || null,
    id,
  ];
  const result = await queryDB(query, values);

  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
}

export async function deleteRecurringEntry(id: number): Promise<boolean> {
  const query = 'DELETE FROM recurring_entries WHERE id = $1 RETURNING *';
  const result = await queryDB(query, [id]);
  return result.rows.length > 0;
}

/**
 * Employee Operations
 */

export async function getEmployeeByCode(code: string): Promise<Employee | null> {
  const query = 'SELECT * FROM employees WHERE code = $1';
  const result = await queryDB(query, [code]);

  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
}

export async function getEmployeeClockEntriesForCurrentWeek(
  employeeId: number
): Promise<ClockEntry[]> {
  const query = `
    SELECT *
    FROM clock_entries
    WHERE employee_id = $1
      AND clock_in >= date_trunc('day', now() - (EXTRACT(ISODOW FROM now())::int - 1) * interval '1 day')
      AND clock_in < date_trunc('day', now() - (EXTRACT(ISODOW FROM now())::int - 1) * interval '1 day') + interval '7 days'
    ORDER BY clock_in ASC
  `;
  const result = await queryDB(query, [employeeId]);
  return result.rows;
}

export function generateEmployeeToken(employeeId: number): string {
  return jwt.sign(
    { name: employeeId },
    process.env.JWT_SECRET || 'default-jwt-secret',
    { expiresIn: '24h' }
  );
}

export async function getAllEmployees(): Promise<Employee[]> {
  const query = 'SELECT * FROM employees ORDER BY id ASC';
  const result = await queryDB(query);
  return result.rows;
}

export async function activateEmployee(id: number): Promise<void> {
  const query = 'UPDATE employees SET active = true WHERE id = $1';
  await queryDB(query, [id]);
}

export async function updateEmployee(
  id: number,
  updates: Partial<Employee>
): Promise<Employee | null> {
  const allowedFields = [
    'firstname',
    'lastname',
    'middlename',
    'nickname',
    'code',
    'admin',
    'manager',
    'fooddiscount',
    'discount',
    'position',
    'rate',
    'active',
    'email',
  ];

  const fields = [];
  const values = [];
  let index = 1;

  for (const key of allowedFields) {
    if (updates.hasOwnProperty(key)) {
      fields.push(`"${key}" = $${index}`);
      values.push(updates[key as keyof Employee]);
      index += 1;
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields provided for update');
  }

  const query = `UPDATE employees SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
  values.push(id);
  const result = await queryDB(query, values);

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

export async function createEmployee(data: {
  firstname: string;
  lastname: string;
  middlename?: string;
  nickname?: string;
  code: string;
  kitchen?: boolean;
  position?: string;
  rate?: number;
  email?: string;
}): Promise<Employee> {
  const query = `
    INSERT INTO employees (firstname, lastname, middlename, nickname, code, kitchen, position, rate, email)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;
  const values = [
    data.firstname,
    data.lastname,
    data.middlename,
    data.nickname,
    data.code,
    data.kitchen,
    data.position,
    data.rate,
    data.email,
  ];
  const result = await queryDB(query, values);
  return result.rows[0];
}

export async function searchEmployees(
  searchQuery: string,
  active?: 'true' | 'false'
): Promise<Employee[]> {
  let query = `
    SELECT * FROM employees
    WHERE
      (CONCAT(firstname, ' ', lastname) ILIKE $1 OR
      CONCAT(nickname, ' ', firstname) ILIKE $1)
  `;

  if (active === 'true') {
    query += ' AND active = true';
  } else if (active === 'false') {
    query += ' AND active = false';
  }

  query += ' ORDER BY firstname ASC';

  const values = [`%${searchQuery}%`];
  const result = await queryDB(query, values);
  return result.rows;
}

/**
 * Clock Entry Operations
 */

export async function createClockEntry(
  employeeId: number,
  clockIn?: string,
  clockOut?: string
): Promise<ClockEntry> {
  const query = `
    INSERT INTO clock_entries (employee_id, clock_in, clock_out)
    VALUES ($1, $2, $3)
    RETURNING id, employee_id, clock_in, clock_out, created_at, updated_at
  `;
  const result = await queryDB(query, [
    employeeId,
    clockIn || new Date().toISOString(),
    clockOut || null,
  ]);
  return result.rows[0];
}

export async function updateClockEntry(
  clockEntryId: number,
  clockIn?: string,
  clockOut?: string
): Promise<ClockEntry | null> {
  const updates = [];
  const values = [];

  if (clockIn) {
    updates.push(`clock_in = $${updates.length + 1}::timestamptz`);
    values.push(clockIn);
  }
  if (clockOut) {
    updates.push(`clock_out = $${updates.length + 1}::timestamptz`);
    values.push(clockOut);
  }

  if (updates.length === 0) {
    // If neither clockIn nor clockOut provided, set clockOut to now
    updates.push(`clock_out = $1::timestamptz`);
    values.push(new Date().toISOString());
  }

  values.push(clockEntryId);

  const query = `
    UPDATE clock_entries
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING id, employee_id, clock_in, clock_out, created_at, updated_at
  `;

  const result = await queryDB(query, values);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function getClockEntries(
  startDate: string,
  endDate: string,
  employeeId?: number
): Promise<any[]> {
  let query = `
    SELECT
      ce.id as clock_entry_id,
      ce.employee_id,
      ce.clock_in,
      ce.clock_out,
      ce.created_at,
      ce.updated_at,
      e.firstname,
      e.lastname,
      e.email
    FROM clock_entries ce
    JOIN employees e ON ce.employee_id = e.id
    WHERE (
        (ce.clock_in BETWEEN $1::timestamp AND $2::timestamp)
        OR (ce.clock_out BETWEEN $1::timestamp AND $2::timestamp)
        OR (ce.clock_in <= $1::timestamp AND ce.clock_out >= $2::timestamp)
      )
  `;
  const values: (string | number)[] = [startDate, endDate];

  if (employeeId) {
    query += ` AND ce.employee_id = $3 `;
    values.push(employeeId);
  }

  query += ` ORDER BY ce.clock_in ASC `;

  const result = await queryDB(query, values);
  return result.rows;
}

export async function deleteClockEntry(id: number): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM clock_entries WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rowCount > 0;
}
