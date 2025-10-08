/**
 * Membership Controller
 *
 * HTTP request handlers for membership operations.
 * Handles request validation, response formatting, and error handling.
 */

import { Request, Response } from 'express';
import * as membershipService from '../services/membershipService';
import { MulterRequest } from '../types/database';

/**
 * Search memberships by name or barcode
 * GET /api/search-memberships
 */
export async function searchMemberships(req: Request, res: Response): Promise<void> {
  try {
    const { name = 'kdjvnsdkjbnvfs', barcode } = req.query;

    const results = await membershipService.searchMemberships(
      name as string,
      barcode as string
    );

    res.json(results);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Get all members with optional name filter
 * GET /api/members
 */
export async function getAllMembers(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.query as { name?: string };

    const members = await membershipService.getAllMembers(name);

    res.status(200).json(members);
  } catch (err: any) {
    console.error('Error fetching members:', err);
    res.status(500).send('Server Error');
  }
}

/**
 * Update a member by membership number
 * PUT /api/member/:membership_number
 */
export async function updateMember(req: Request, res: Response): Promise<void> {
  try {
    const membershipNumber = parseInt(req.params.membership_number, 10);

    if (isNaN(membershipNumber)) {
      res.status(400).send('Invalid membership number');
      return;
    }

    const updatedMember = await membershipService.updateMember(
      membershipNumber,
      req.body
    );

    if (!updatedMember) {
      res.status(404).send('Member not found');
      return;
    }

    res.status(200).json(updatedMember);
  } catch (err: any) {
    if (err.message === 'No fields to update') {
      res.status(400).send('No fields to update');
      return;
    }
    console.error('Error updating member:', err);
    res.status(500).send('Server Error');
  }
}

/**
 * Get membership details by name, barcode, or email
 * GET /api/memberships-details
 */
export async function getMembershipDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name, barcode, email } = req.query;

    const results = await membershipService.getMembershipDetails(
      name as string,
      barcode as string,
      email as string
    );

    res.json(results);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Get member photo metadata from Google Drive
 * GET /api/member-photo
 */
export async function getMemberPhoto(req: Request, res: Response): Promise<void> {
  try {
    const { membership_number } = req.query;

    if (!membership_number) {
      res.status(400).send('Membership number is required');
      return;
    }

    const photo = await membershipService.getMemberPhotoMetadata(
      membership_number as string
    );

    if (!photo) {
      res.status(404).send('Photo not found');
      return;
    }

    res.json(photo);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Get member photo stream from Google Drive
 * GET /api/get-member-photo
 */
export async function getMemberPhotoStream(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { membership_number } = req.query;

    if (!membership_number) {
      res.status(400).send('Membership number is required');
      return;
    }

    const photoStream = await membershipService.getMemberPhotoStream(
      membership_number as string
    );

    if (!photoStream) {
      res.status(404).send('Photo not found');
      return;
    }

    res.setHeader('Content-Type', 'image/jpeg');
    photoStream.pipe(res);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Upload member photo to Google Drive
 * POST /api/upload-member-photo
 */
export async function uploadMemberPhoto(
  req: MulterRequest,
  res: Response
): Promise<void> {
  try {
    const { membership_number } = req.body;

    if (!membership_number || !req.file) {
      res.status(400).send('Membership number and file are required');
      return;
    }

    const fileId = await membershipService.uploadMemberPhoto(
      membership_number,
      req.file.buffer,
      req.file.mimetype
    );

    res.status(200).send({ message: 'File uploaded successfully', fileId });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Create a new member
 * POST /api/create-member
 */
export async function createMember(req: Request, res: Response): Promise<void> {
  try {
    const { name, membership_type, dob, sub_id, barcode } = req.body;

    const newMember = await membershipService.createMember({
      name,
      membership_type,
      dob,
      sub_id,
      barcode,
    });

    res.status(201).json(newMember);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Edit member basic info
 * POST /api/edit-member
 */
export async function editMember(req: Request, res: Response): Promise<void> {
  try {
    const {
      alert,
      valid_until,
      name,
      membership_type,
      dob,
      sub_id,
      barcode,
      membership_number,
    } = req.body;

    const updatedMember = await membershipService.editMember({
      alert,
      valid_until,
      name,
      membership_type,
      dob,
      sub_id,
      barcode,
      membership_number,
    });

    if (!updatedMember) {
      res.status(404).send('Member not found');
      return;
    }

    res.status(200).json(updatedMember);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Create a check-in visit
 * POST /api/checkin
 */
export async function checkin(req: Request, res: Response): Promise<void> {
  try {
    const { membership_number, visit_timestamp } = req.body;

    const checkinRecord = await membershipService.checkin(
      membership_number,
      visit_timestamp
    );

    res.status(201).json(checkinRecord);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Delete most recent check-in for a member
 * POST /api/delete-recent-checkin
 */
export async function deleteRecentCheckin(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { membership_number } = req.body;

    const deletedCheckin = await membershipService.deleteRecentCheckin(
      membership_number
    );

    if (!deletedCheckin) {
      res.status(404).json({ message: 'No check-ins found for this member' });
      return;
    }

    res.status(200).json(deletedCheckin);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Delete a specific visit by ID
 * DELETE /api/visit/:id
 */
export async function deleteVisit(req: Request, res: Response): Promise<void> {
  try {
    const visitId = parseInt(req.params.id, 10);
    if (isNaN(visitId)) {
      res.status(400).send('Invalid visit ID');
      return;
    }

    const deleted = await membershipService.deleteVisit(visitId);

    if (!deleted) {
      res.status(404).send('Visit not found');
      return;
    }

    res.status(200).json({ message: 'Visit deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting visit:', err);
    res.status(500).send('Server Error');
  }
}

/**
 * Get visits for multiple membership numbers
 * GET /api/get-visits
 */
export async function getVisits(req: Request, res: Response): Promise<void> {
  try {
    let membershipNumbersArray: string[] = [];

    if (typeof req.query.membership_numbers === 'string') {
      membershipNumbersArray = req.query.membership_numbers.split(',');
    }

    const visits = await membershipService.getVisits(membershipNumbersArray);

    res.status(200).json(visits);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Get visits for a specific date with member info
 * GET /api/visits
 */
export async function getVisitsWithMembers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const dateParam = req.query.date as string;

    if (!dateParam) {
      res.status(400).send('Date parameter is required');
      return;
    }

    // Validate the date format
    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      res.status(400).send('Invalid date format');
      return;
    }

    const visits = await membershipService.getVisitsByDateWithMembers(dateParam);

    res.status(200).json(visits);
  } catch (err: any) {
    console.error('Error fetching visits:', err);
    res.status(500).send('Server Error');
  }
}

/**
 * Get visits for a date range
 * GET /api/get-visits-by-date
 */
export async function getVisitsByDate(req: Request, res: Response): Promise<void> {
  try {
    const date = req.query.date as string;
    const startingdate = req.query.startingdate as string;

    if (!date) {
      res.status(400).send('Date is required');
      return;
    }

    // Format the date to ensure it covers the full day
    const startDate = new Date(startingdate || date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const visits = await membershipService.getVisitsByDateRange(startDate, endDate);

    res.status(200).json(visits);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Add attendance record
 * POST /api/add-attendance
 */
export async function addAttendance(req: Request, res: Response): Promise<void> {
  try {
    const { category, quantity, order_number, date } = req.body;

    const attendance = await membershipService.addAttendance({
      category,
      quantity,
      order_number,
      date,
    });

    res.status(201).json(attendance);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Get attendance for a specific date
 * POST /api/get-attendance
 */
export async function getAttendance(req: Request, res: Response): Promise<void> {
  try {
    const { date } = req.body;

    const attendance = await membershipService.getAttendance(date);

    res.status(201).json(attendance);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Cancel attendance for an order number
 * POST /api/cancel-attendance
 */
export async function cancelAttendance(req: Request, res: Response): Promise<void> {
  try {
    const { order_number } = req.body;

    const result = await membershipService.cancelAttendance(order_number);

    if (
      result.attendanceRecords.length === 0 &&
      result.calendarRecords.length === 0
    ) {
      res.status(204).json({
        message: 'No attendance records found for this order number in either table',
      });
      return;
    }

    res.status(200).json({
      message: 'Attendance cancelled successfully in both tables',
      updatedAttendanceRecords: result.attendanceRecords,
      updatedCalendarRecords: result.calendarRecords,
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Add calendar attendance
 * POST /api/add-calendar-attendance
 */
export async function addCalendarAttendance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { category, quantity, order_number, date } = req.body;

    const calendarAttendance = await membershipService.addCalendarAttendance({
      category,
      quantity,
      order_number,
      date,
    });

    res.status(201).json(calendarAttendance);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Get calendar attendance for a date range
 * POST /api/get-calendar-attendance
 */
export async function getCalendarAttendance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { startDate, date } = req.body;

    if (!date) {
      res.status(400).send('Date is required');
      return;
    }

    const attendance = await membershipService.getCalendarAttendance(
      startDate || date,
      date
    );

    res.status(200).json(attendance);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * Create membership discount code in Shopify
 * POST /api/create-membership-discount
 */
export async function createMembershipDiscount(
  req: Request,
  res: Response
): Promise<void> {
  const discountAmount = parseFloat(req.body.discountAmount);
  const discountCode = req.body.discountCode;

  try {
    const discountInfo = await membershipService.createMembershipDiscount(
      discountCode,
      discountAmount
    );

    res.send(discountInfo);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send({ message: error.message });
  }
}
