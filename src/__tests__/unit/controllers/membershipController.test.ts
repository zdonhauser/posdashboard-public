/**
 * Membership Controller Tests
 */

import { Request, Response } from 'express';
import * as membershipController from '../../../controllers/membershipController';
import * as membershipService from '../../../services/membershipService';
import { MulterRequest } from '../../../types/database';

// Mock dependencies
jest.mock('../../../services/membershipService');

describe('Membership Controller', () => {
  let mockRequest: Partial<Request | MulterRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    sendMock = jest.fn();
    setHeaderMock = jest.fn();
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
      setHeader: setHeaderMock,
    };

    jest.clearAllMocks();
  });

  describe('Search Operations', () => {
    describe('searchMemberships', () => {
      it('should return search results', async () => {
        const mockResults = [
          { membership_number: 1, name: 'John Doe', membership_type: 'Annual' },
        ];
        mockRequest.query = { name: 'John', barcode: '123' };

        (membershipService.searchMemberships as jest.Mock).mockResolvedValue(mockResults);

        await membershipController.searchMemberships(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(membershipService.searchMemberships).toHaveBeenCalledWith('John', '123');
        expect(jsonMock).toHaveBeenCalledWith(mockResults);
      });

      it('should handle errors', async () => {
        mockRequest.query = {};
        (membershipService.searchMemberships as jest.Mock).mockRejectedValue(
          new Error('Database error')
        );

        await membershipController.searchMemberships(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(sendMock).toHaveBeenCalledWith('Server Error');
      });
    });

    describe('getAllMembers', () => {
      it('should return all members', async () => {
        const mockMembers = [{ membership_number: 1, name: 'John Doe' }];
        mockRequest.query = { name: 'John' };

        (membershipService.getAllMembers as jest.Mock).mockResolvedValue(mockMembers);

        await membershipController.getAllMembers(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(membershipService.getAllMembers).toHaveBeenCalledWith('John');
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(mockMembers);
      });
    });

    describe('getMembershipDetails', () => {
      it('should return membership details', async () => {
        const mockDetails = [{ membership_number: 1, name: 'John Doe' }];
        mockRequest.query = { name: 'John', barcode: '123', email: 'john@example.com' };

        (membershipService.getMembershipDetails as jest.Mock).mockResolvedValue(mockDetails);

        await membershipController.getMembershipDetails(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(membershipService.getMembershipDetails).toHaveBeenCalledWith(
          'John',
          '123',
          'john@example.com'
        );
        expect(jsonMock).toHaveBeenCalledWith(mockDetails);
      });
    });
  });

  describe('Member CRUD Operations', () => {
    describe('updateMember', () => {
      it('should update a member', async () => {
        const mockMember = { membership_number: 1, name: 'John Doe Updated' };
        mockRequest.params = { membership_number: '1' };
        mockRequest.body = { name: 'John Doe Updated' };

        (membershipService.updateMember as jest.Mock).mockResolvedValue(mockMember);

        await membershipController.updateMember(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(membershipService.updateMember).toHaveBeenCalledWith(1, { name: 'John Doe Updated' });
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(mockMember);
      });

      it('should return 400 for invalid membership number', async () => {
        mockRequest.params = { membership_number: 'invalid' };

        await membershipController.updateMember(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith('Invalid membership number');
      });

      it('should return 404 if member not found', async () => {
        mockRequest.params = { membership_number: '999' };
        mockRequest.body = { name: 'Test' };

        (membershipService.updateMember as jest.Mock).mockResolvedValue(null);

        await membershipController.updateMember(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(sendMock).toHaveBeenCalledWith('Member not found');
      });

      it('should return 400 for no fields to update', async () => {
        mockRequest.params = { membership_number: '1' };
        mockRequest.body = {};

        (membershipService.updateMember as jest.Mock).mockRejectedValue(
          new Error('No fields to update')
        );

        await membershipController.updateMember(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith('No fields to update');
      });
    });

    describe('createMember', () => {
      it('should create a new member', async () => {
        const mockMember = { membership_number: 1, name: 'John Doe' };
        mockRequest.body = { name: 'John Doe', membership_type: 'Annual' };

        (membershipService.createMember as jest.Mock).mockResolvedValue(mockMember);

        await membershipController.createMember(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(mockMember);
      });
    });

    describe('editMember', () => {
      it('should edit member basic info', async () => {
        const mockMember = { membership_number: 1, name: 'John Doe' };
        mockRequest.body = { membership_number: 1, name: 'John Doe', alert: 'Test alert' };

        (membershipService.editMember as jest.Mock).mockResolvedValue(mockMember);

        await membershipController.editMember(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(mockMember);
      });

      it('should return 404 if member not found', async () => {
        mockRequest.body = { membership_number: 999, name: 'Test' };

        (membershipService.editMember as jest.Mock).mockResolvedValue(null);

        await membershipController.editMember(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(sendMock).toHaveBeenCalledWith('Member not found');
      });
    });
  });

  describe('Photo Operations', () => {
    describe('getMemberPhoto', () => {
      it('should return photo metadata', async () => {
        const mockPhoto = { id: 'file123', name: '000001.jpg' };
        mockRequest.query = { membership_number: '1' };

        (membershipService.getMemberPhotoMetadata as jest.Mock).mockResolvedValue(mockPhoto);

        await membershipController.getMemberPhoto(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(membershipService.getMemberPhotoMetadata).toHaveBeenCalledWith('1');
        expect(jsonMock).toHaveBeenCalledWith(mockPhoto);
      });

      it('should return 400 if membership number is missing', async () => {
        mockRequest.query = {};

        await membershipController.getMemberPhoto(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith('Membership number is required');
      });

      it('should return 404 if photo not found', async () => {
        mockRequest.query = { membership_number: '999' };

        (membershipService.getMemberPhotoMetadata as jest.Mock).mockResolvedValue(null);

        await membershipController.getMemberPhoto(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(sendMock).toHaveBeenCalledWith('Photo not found');
      });
    });

    describe('getMemberPhotoStream', () => {
      it('should return photo stream', async () => {
        const mockStream = { pipe: jest.fn() };
        mockRequest.query = { membership_number: '1' };

        (membershipService.getMemberPhotoStream as jest.Mock).mockResolvedValue(mockStream);

        await membershipController.getMemberPhotoStream(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
        expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
      });

      it('should return 404 if photo not found', async () => {
        mockRequest.query = { membership_number: '999' };

        (membershipService.getMemberPhotoStream as jest.Mock).mockResolvedValue(null);

        await membershipController.getMemberPhotoStream(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(sendMock).toHaveBeenCalledWith('Photo not found');
      });
    });

    describe('uploadMemberPhoto', () => {
      it('should upload photo', async () => {
        const mockBuffer = Buffer.from('test');
        mockRequest.body = { membership_number: '1' };
        (mockRequest as MulterRequest).file = {
          buffer: mockBuffer,
          mimetype: 'image/jpeg',
          fieldname: 'file',
          originalname: 'test.jpg',
          encoding: '7bit',
          size: 1024,
        } as any;

        (membershipService.uploadMemberPhoto as jest.Mock).mockResolvedValue('file123');

        await membershipController.uploadMemberPhoto(
          mockRequest as MulterRequest,
          mockResponse as Response
        );

        expect(membershipService.uploadMemberPhoto).toHaveBeenCalledWith(
          '1',
          mockBuffer,
          'image/jpeg'
        );
        expect(statusMock).toHaveBeenCalledWith(200);
      });

      it('should return 400 if membership number or file is missing', async () => {
        mockRequest.body = {};

        await membershipController.uploadMemberPhoto(
          mockRequest as MulterRequest,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith('Membership number and file are required');
      });
    });
  });

  describe('Check-in & Visit Operations', () => {
    describe('checkin', () => {
      it('should create a check-in', async () => {
        const mockCheckin = { id: 1, membership_number: 1, visit_timestamp: '2024-01-01' };
        mockRequest.body = { membership_number: 1, visit_timestamp: '2024-01-01' };

        (membershipService.checkin as jest.Mock).mockResolvedValue(mockCheckin);

        await membershipController.checkin(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(mockCheckin);
      });
    });

    describe('deleteRecentCheckin', () => {
      it('should delete recent check-in', async () => {
        const mockCheckin = { id: 1, membership_number: 1 };
        mockRequest.body = { membership_number: 1 };

        (membershipService.deleteRecentCheckin as jest.Mock).mockResolvedValue(mockCheckin);

        await membershipController.deleteRecentCheckin(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(mockCheckin);
      });

      it('should return 404 if no check-ins found', async () => {
        mockRequest.body = { membership_number: 999 };

        (membershipService.deleteRecentCheckin as jest.Mock).mockResolvedValue(null);

        await membershipController.deleteRecentCheckin(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
      });
    });

    describe('deleteVisit', () => {
      it('should delete a visit', async () => {
        mockRequest.params = { id: '1' };

        (membershipService.deleteVisit as jest.Mock).mockResolvedValue(true);

        await membershipController.deleteVisit(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ message: 'Visit deleted successfully' });
      });

      it('should return 400 for invalid visit ID', async () => {
        mockRequest.params = { id: 'invalid' };

        await membershipController.deleteVisit(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith('Invalid visit ID');
      });

      it('should return 404 if visit not found', async () => {
        mockRequest.params = { id: '999' };

        (membershipService.deleteVisit as jest.Mock).mockResolvedValue(false);

        await membershipController.deleteVisit(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(sendMock).toHaveBeenCalledWith('Visit not found');
      });
    });

    describe('getVisits', () => {
      it('should return visits for membership numbers', async () => {
        const mockVisits = [{ id: 1, membership_number: 1 }];
        mockRequest.query = { membership_numbers: '1,2' };

        (membershipService.getVisits as jest.Mock).mockResolvedValue(mockVisits);

        await membershipController.getVisits(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(membershipService.getVisits).toHaveBeenCalledWith(['1', '2']);
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(mockVisits);
      });
    });

    describe('getVisitsWithMembers', () => {
      it('should return visits with member info', async () => {
        const mockVisits = [{ visit_id: 1, name: 'John Doe' }];
        mockRequest.query = { date: '2024-01-01' };

        (membershipService.getVisitsByDateWithMembers as jest.Mock).mockResolvedValue(
          mockVisits
        );

        await membershipController.getVisitsWithMembers(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(mockVisits);
      });

      it('should return 400 if date is missing', async () => {
        mockRequest.query = {};

        await membershipController.getVisitsWithMembers(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith('Date parameter is required');
      });

      it('should return 400 for invalid date format', async () => {
        mockRequest.query = { date: 'invalid' };

        await membershipController.getVisitsWithMembers(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith('Invalid date format');
      });
    });

    describe('getVisitsByDate', () => {
      it('should return visits for date range', async () => {
        const mockVisits = [{ id: 1, membership_number: 1 }];
        mockRequest.query = { date: '2024-01-01', startingdate: '2024-01-01' };

        (membershipService.getVisitsByDateRange as jest.Mock).mockResolvedValue(mockVisits);

        await membershipController.getVisitsByDate(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(mockVisits);
      });

      it('should return 400 if date is missing', async () => {
        mockRequest.query = {};

        await membershipController.getVisitsByDate(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith('Date is required');
      });
    });
  });

  describe('Attendance Operations', () => {
    describe('addAttendance', () => {
      it('should add attendance record', async () => {
        const mockAttendance = { id: 1, category: 'class' };
        mockRequest.body = { category: 'class', quantity: 10, order_number: 'ORD123', date: '2024-01-01' };

        (membershipService.addAttendance as jest.Mock).mockResolvedValue(mockAttendance);

        await membershipController.addAttendance(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(mockAttendance);
      });
    });

    describe('getAttendance', () => {
      it('should return attendance for a date', async () => {
        const mockAttendance = [{ id: 1, date: '2024-01-01' }];
        mockRequest.body = { date: '2024-01-01' };

        (membershipService.getAttendance as jest.Mock).mockResolvedValue(mockAttendance);

        await membershipController.getAttendance(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(mockAttendance);
      });
    });

    describe('cancelAttendance', () => {
      it('should cancel attendance', async () => {
        const mockResult = {
          attendanceRecords: [{ id: 1, cancelled: true }],
          calendarRecords: [{ id: 1, cancelled: true }],
        };
        mockRequest.body = { order_number: 'ORD123' };

        (membershipService.cancelAttendance as jest.Mock).mockResolvedValue(mockResult);

        await membershipController.cancelAttendance(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(200);
      });

      it('should return 204 if no records found', async () => {
        const mockResult = {
          attendanceRecords: [],
          calendarRecords: [],
        };
        mockRequest.body = { order_number: 'ORD999' };

        (membershipService.cancelAttendance as jest.Mock).mockResolvedValue(mockResult);

        await membershipController.cancelAttendance(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(204);
      });
    });

    describe('addCalendarAttendance', () => {
      it('should add calendar attendance', async () => {
        const mockCalendar = { id: 1, category: 'event' };
        mockRequest.body = { category: 'event', quantity: 5, order_number: 'ORD456', date: '2024-01-01' };

        (membershipService.addCalendarAttendance as jest.Mock).mockResolvedValue(mockCalendar);

        await membershipController.addCalendarAttendance(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(mockCalendar);
      });
    });

    describe('getCalendarAttendance', () => {
      it('should return calendar attendance', async () => {
        const mockCalendar = [{ id: 1, date: '2024-01-01' }];
        mockRequest.body = { startDate: '2024-01-01', date: '2024-01-31' };

        (membershipService.getCalendarAttendance as jest.Mock).mockResolvedValue(mockCalendar);

        await membershipController.getCalendarAttendance(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(mockCalendar);
      });

      it('should return 400 if date is missing', async () => {
        mockRequest.body = {};

        await membershipController.getCalendarAttendance(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith('Date is required');
      });
    });
  });

  describe('Discount Operations', () => {
    describe('createMembershipDiscount', () => {
      it('should create membership discount', async () => {
        const mockDiscount = { data: { discountCodeBasicCreate: { codeDiscountNode: { id: 'discount123' } } } };
        mockRequest.body = { discountCode: 'CODE123', discountAmount: '10.00' };

        (membershipService.createMembershipDiscount as jest.Mock).mockResolvedValue(
          mockDiscount.data
        );

        await membershipController.createMembershipDiscount(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(membershipService.createMembershipDiscount).toHaveBeenCalledWith('CODE123', 10);
        expect(sendMock).toHaveBeenCalledWith(mockDiscount.data);
      });

      it('should handle errors', async () => {
        mockRequest.body = { discountCode: 'CODE123', discountAmount: '10.00' };

        (membershipService.createMembershipDiscount as jest.Mock).mockRejectedValue(
          new Error('Discount error')
        );

        await membershipController.createMembershipDiscount(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusMock).toHaveBeenCalledWith(500);
      });
    });
  });
});
