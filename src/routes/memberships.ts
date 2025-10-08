/**
 * Membership Routes
 *
 * Defines HTTP routes for membership management, including:
 * - Member CRUD operations
 * - Photo management
 * - Check-in/visit tracking
 * - Attendance management
 * - Discount code creation
 */

import { Router } from 'express';
import multer from 'multer';
import * as membershipController from '../controllers/membershipController';

const router = Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Member CRUD Routes
 */

// GET /api/search-memberships - Search memberships by name or barcode
router.get('/search-memberships', membershipController.searchMemberships);

// GET /api/members - Get all members with optional name filter
router.get('/members', membershipController.getAllMembers);

// PUT /api/member/:membership_number - Update a member
router.put('/member/:membership_number', membershipController.updateMember);

// GET /api/memberships-details - Get membership details
router.get('/memberships-details', membershipController.getMembershipDetails);

// POST /api/create-member - Create a new member
router.post('/create-member', membershipController.createMember);

// POST /api/edit-member - Edit member basic info
router.post('/edit-member', membershipController.editMember);

/**
 * Member Photo Routes
 */

// GET /api/member-photo - Get member photo metadata from Google Drive
router.get('/member-photo', membershipController.getMemberPhoto);

// GET /api/get-member-photo - Get member photo stream from Google Drive
router.get('/get-member-photo', membershipController.getMemberPhotoStream);

// POST /api/upload-member-photo - Upload member photo to Google Drive
router.post(
  '/upload-member-photo',
  upload.single('image'),
  membershipController.uploadMemberPhoto
);

/**
 * Check-in & Visit Routes
 */

// POST /api/checkin - Create a check-in visit
router.post('/checkin', membershipController.checkin);

// POST /api/delete-recent-checkin - Delete most recent check-in
router.post('/delete-recent-checkin', membershipController.deleteRecentCheckin);

// DELETE /api/visit/:id - Delete a specific visit
router.delete('/visit/:id', membershipController.deleteVisit);

// GET /api/get-visits - Get visits for multiple membership numbers
router.get('/get-visits', membershipController.getVisits);

// GET /api/visits - Get visits with member info for a specific date
router.get('/visits', membershipController.getVisitsWithMembers);

// GET /api/get-visits-by-date - Get visits for a date range
router.get('/get-visits-by-date', membershipController.getVisitsByDate);

/**
 * Attendance Routes
 */

// POST /api/add-attendance - Add attendance record
router.post('/add-attendance', membershipController.addAttendance);

// POST /api/get-attendance - Get attendance for a date
router.post('/get-attendance', membershipController.getAttendance);

// POST /api/cancel-attendance - Cancel attendance for an order
router.post('/cancel-attendance', membershipController.cancelAttendance);

// POST /api/add-calendar-attendance - Add calendar attendance
router.post('/add-calendar-attendance', membershipController.addCalendarAttendance);

// POST /api/get-calendar-attendance - Get calendar attendance for date range
router.post('/get-calendar-attendance', membershipController.getCalendarAttendance);

/**
 * Discount Routes
 */

// POST /api/create-membership-discount - Create Shopify discount code
router.post('/create-membership-discount', membershipController.createMembershipDiscount);

export default router;
