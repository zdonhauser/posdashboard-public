/**
 * Membership Service Tests
 */

import * as membershipService from '../../../services/membershipService';
import * as database from '../../../config/database';
import * as googleDrive from '../../../config/google-drive';

// Mock dependencies
jest.mock('../../../config/database');
jest.mock('../../../config/google-drive');

// Mock fetch
global.fetch = jest.fn();

describe('Membership Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Operations', () => {
    describe('searchMemberships', () => {
      it('should search memberships by name', async () => {
        const mockResults = [
          { membership_number: 1, name: 'John Doe', membership_type: 'Annual', sub_id: '123' },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockResults });

        const results = await membershipService.searchMemberships('John');

        expect(database.queryDB).toHaveBeenCalled();
        expect(results).toEqual(mockResults);
      });

      it('should search memberships by barcode', async () => {
        const mockResults = [
          { membership_number: 1, name: 'John Doe', membership_type: 'Annual', sub_id: '123' },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockResults });

        const results = await membershipService.searchMemberships(undefined, '123456');

        expect(database.queryDB).toHaveBeenCalled();
        expect(results).toEqual(mockResults);
      });
    });

    describe('getAllMembers', () => {
      it('should fetch all members', async () => {
        const mockMembers = [
          { membership_number: 1, name: 'John Doe' },
          { membership_number: 2, name: 'Jane Smith' },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockMembers });

        const results = await membershipService.getAllMembers();

        expect(database.queryDB).toHaveBeenCalled();
        expect(results).toEqual(mockMembers);
      });

      it('should filter members by name', async () => {
        const mockMembers = [{ membership_number: 1, name: 'John Doe' }];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockMembers });

        const results = await membershipService.getAllMembers('John');

        expect(database.queryDB).toHaveBeenCalled();
        expect(results).toEqual(mockMembers);
      });
    });

    describe('getMembershipDetails', () => {
      it('should get membership details by name', async () => {
        const mockMembers = [
          { membership_number: 1, name: 'John Doe', email: 'john@example.com' },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockMembers });

        const results = await membershipService.getMembershipDetails('John');

        expect(database.queryDB).toHaveBeenCalled();
        expect(results).toEqual(mockMembers);
      });
    });
  });

  describe('Member CRUD Operations', () => {
    describe('updateMember', () => {
      it('should update a member', async () => {
        const mockMember = { membership_number: 1, name: 'John Doe Updated' };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockMember] });

        const result = await membershipService.updateMember(1, { name: 'John Doe Updated' });

        expect(database.queryDB).toHaveBeenCalled();
        expect(result).toEqual(mockMember);
      });

      it('should return null if member not found', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await membershipService.updateMember(999, { name: 'Test' });

        expect(result).toBeNull();
      });

      it('should throw error if no fields to update', async () => {
        await expect(membershipService.updateMember(1, {})).rejects.toThrow(
          'No fields to update'
        );
      });
    });

    describe('createMember', () => {
      it('should create a new member', async () => {
        const mockMember = {
          membership_number: 1,
          name: 'John Doe',
          membership_type: 'Annual',
        };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockMember] });

        const result = await membershipService.createMember({
          name: 'John Doe',
          membership_type: 'Annual',
        });

        expect(result).toEqual(mockMember);
      });
    });

    describe('editMember', () => {
      it('should edit member basic info', async () => {
        const mockMember = {
          membership_number: 1,
          name: 'John Doe',
          alert: 'Test alert',
        };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockMember] });

        const result = await membershipService.editMember({
          membership_number: 1,
          name: 'John Doe',
          alert: 'Test alert',
        });

        expect(result).toEqual(mockMember);
      });

      it('should return null if member not found', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await membershipService.editMember({
          membership_number: 999,
          name: 'Test',
        });

        expect(result).toBeNull();
      });
    });
  });

  describe('Photo Operations', () => {
    const mockDrive = {
      files: {
        list: jest.fn(),
        get: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    beforeEach(() => {
      (googleDrive.drive as any) = mockDrive;
    });

    describe('getMemberPhotoMetadata', () => {
      it('should get photo metadata from Google Drive', async () => {
        const mockPhoto = {
          id: 'file123',
          name: '000001.jpg',
          webContentLink: 'https://drive.google.com/file/123',
        };

        mockDrive.files.list.mockResolvedValue({
          data: { files: [mockPhoto] },
        });

        const result = await membershipService.getMemberPhotoMetadata('1');

        expect(mockDrive.files.list).toHaveBeenCalled();
        expect(result).toEqual(mockPhoto);
      });

      it('should return null if photo not found', async () => {
        mockDrive.files.list.mockResolvedValue({
          data: { files: [] },
        });

        const result = await membershipService.getMemberPhotoMetadata('999');

        expect(result).toBeNull();
      });
    });

    describe('getMemberPhotoStream', () => {
      it('should get photo stream from Google Drive', async () => {
        const mockStream = { pipe: jest.fn() };

        mockDrive.files.list.mockResolvedValue({
          data: { files: [{ id: 'file123', name: '000001.jpg' }] },
        });

        mockDrive.files.get.mockResolvedValue({
          data: mockStream,
        });

        const result = await membershipService.getMemberPhotoStream('1');

        expect(mockDrive.files.get).toHaveBeenCalled();
        expect(result).toEqual(mockStream);
      });

      it('should return null if photo not found', async () => {
        mockDrive.files.list.mockResolvedValue({
          data: { files: [] },
        });

        const result = await membershipService.getMemberPhotoStream('999');

        expect(result).toBeNull();
      });
    });

    describe('uploadMemberPhoto', () => {
      it('should update existing photo', async () => {
        const mockBuffer = Buffer.from('test');

        mockDrive.files.list.mockResolvedValue({
          data: { files: [{ id: 'file123', name: '000001.jpg' }] },
        });

        mockDrive.files.update.mockResolvedValue({
          data: { id: 'file123' },
        });

        const result = await membershipService.uploadMemberPhoto('1', mockBuffer, 'image/jpeg');

        expect(mockDrive.files.update).toHaveBeenCalled();
        expect(result).toBe('file123');
      });

      it('should create new photo if not exists', async () => {
        const mockBuffer = Buffer.from('test');

        mockDrive.files.list.mockResolvedValue({
          data: { files: [] },
        });

        mockDrive.files.create.mockResolvedValue({
          data: { id: 'file456' },
        });

        const result = await membershipService.uploadMemberPhoto('1', mockBuffer, 'image/jpeg');

        expect(mockDrive.files.create).toHaveBeenCalled();
        expect(result).toBe('file456');
      });
    });
  });

  describe('Check-in & Visit Operations', () => {
    describe('checkin', () => {
      it('should create a check-in visit', async () => {
        const mockCheckin = {
          id: 1,
          membership_number: 1,
          visit_timestamp: '2024-01-01T10:00:00Z',
        };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockCheckin] });

        const result = await membershipService.checkin(1, '2024-01-01T10:00:00Z');

        expect(database.queryDB).toHaveBeenCalled();
        expect(result).toEqual(mockCheckin);
      });
    });

    describe('deleteRecentCheckin', () => {
      it('should delete most recent check-in', async () => {
        const mockCheckin = { id: 1, membership_number: 1 };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockCheckin] });

        const result = await membershipService.deleteRecentCheckin(1);

        expect(database.queryDB).toHaveBeenCalled();
        expect(result).toEqual(mockCheckin);
      });

      it('should return null if no check-ins found', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await membershipService.deleteRecentCheckin(999);

        expect(result).toBeNull();
      });
    });

    describe('deleteVisit', () => {
      it('should delete a specific visit', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

        const result = await membershipService.deleteVisit(1);

        expect(database.queryDB).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should return false if visit not found', async () => {
        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await membershipService.deleteVisit(999);

        expect(result).toBe(false);
      });
    });

    describe('getVisits', () => {
      it('should get visits for multiple membership numbers', async () => {
        const mockVisits = [
          { id: 1, membership_number: 1 },
          { id: 2, membership_number: 2 },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockVisits });

        const result = await membershipService.getVisits(['1', '2']);

        expect(database.queryDB).toHaveBeenCalled();
        expect(result).toEqual(mockVisits);
      });
    });

    describe('getVisitsByDateWithMembers', () => {
      it('should get visits with member info for a date', async () => {
        const mockVisits = [
          {
            visit_id: 1,
            membership_number: 1,
            name: 'John Doe',
            membership_type: 'Annual',
          },
        ];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockVisits });

        const result = await membershipService.getVisitsByDateWithMembers('2024-01-01');

        expect(database.queryDB).toHaveBeenCalled();
        expect(result).toEqual(mockVisits);
      });
    });

    describe('getVisitsByDateRange', () => {
      it('should get visits for a date range', async () => {
        const mockVisits = [{ id: 1, membership_number: 1 }];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockVisits });

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await membershipService.getVisitsByDateRange(startDate, endDate);

        expect(database.queryDB).toHaveBeenCalled();
        expect(result).toEqual(mockVisits);
      });
    });
  });

  describe('Attendance Operations', () => {
    describe('addAttendance', () => {
      it('should add attendance record', async () => {
        const mockAttendance = {
          id: 1,
          category: 'class',
          quantity: 10,
          order_number: 'ORD123',
          date: '2024-01-01',
        };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockAttendance] });

        const result = await membershipService.addAttendance({
          category: 'class',
          quantity: 10,
          order_number: 'ORD123',
          date: '2024-01-01',
        });

        expect(result).toEqual(mockAttendance);
      });
    });

    describe('getAttendance', () => {
      it('should get attendance for a date', async () => {
        const mockAttendance = [{ id: 1, date: '2024-01-01' }];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockAttendance });

        const result = await membershipService.getAttendance('2024-01-01');

        expect(result).toEqual(mockAttendance);
      });
    });

    describe('cancelAttendance', () => {
      it('should cancel attendance for an order', async () => {
        const mockAttendance = [{ id: 1, cancelled: true }];
        const mockCalendar = [{ id: 1, cancelled: true }];

        (database.queryDB as jest.Mock)
          .mockResolvedValueOnce({ rows: mockAttendance })
          .mockResolvedValueOnce({ rows: mockCalendar });

        const result = await membershipService.cancelAttendance('ORD123');

        expect(result.attendanceRecords).toEqual(mockAttendance);
        expect(result.calendarRecords).toEqual(mockCalendar);
      });
    });

    describe('addCalendarAttendance', () => {
      it('should add calendar attendance', async () => {
        const mockCalendar = {
          id: 1,
          category: 'event',
          quantity: 5,
          order_number: 'ORD456',
          date: '2024-01-01',
        };

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: [mockCalendar] });

        const result = await membershipService.addCalendarAttendance({
          category: 'event',
          quantity: 5,
          order_number: 'ORD456',
          date: '2024-01-01',
        });

        expect(result).toEqual(mockCalendar);
      });
    });

    describe('getCalendarAttendance', () => {
      it('should get calendar attendance for date range', async () => {
        const mockCalendar = [{ id: 1, date: '2024-01-01' }];

        (database.queryDB as jest.Mock).mockResolvedValue({ rows: mockCalendar });

        const result = await membershipService.getCalendarAttendance(
          '2024-01-01',
          '2024-01-31'
        );

        expect(result).toEqual(mockCalendar);
      });
    });
  });

  describe('Discount Operations', () => {
    describe('createMembershipDiscount', () => {
      it('should create membership discount in Shopify', async () => {
        const mockResponse = {
          data: {
            discountCodeBasicCreate: {
              codeDiscountNode: { id: 'discount123' },
              userErrors: [],
            },
          },
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse,
        });

        const result = await membershipService.createMembershipDiscount('CODE123', 10.0);

        expect(global.fetch).toHaveBeenCalled();
        expect(result).toEqual(mockResponse.data);
      });

      it('should throw error if Shopify returns user errors', async () => {
        const mockResponse = {
          data: {
            discountCodeBasicCreate: {
              userErrors: [{ field: 'code', message: 'Code already exists' }],
            },
          },
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse,
        });

        await expect(
          membershipService.createMembershipDiscount('CODE123', 10.0)
        ).rejects.toThrow('Code already exists');
      });
    });
  });
});
