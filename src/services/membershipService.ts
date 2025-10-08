/**
 * Membership Service
 *
 * Business logic for membership operations including:
 * - Member CRUD operations
 * - Photo management (Google Drive)
 * - Check-in/visit tracking
 * - Attendance management
 * - Discount code creation
 */

import { queryDB } from '@config/database';
import { drive } from '@config/google-drive';
import { shopifyConfig } from '@config/shopify';
import { Readable } from 'stream';

/**
 * Search memberships by name or barcode
 */
export async function searchMemberships(name?: string, barcode?: string) {
  let query =
    'SELECT membership_number, name, membership_type, sub_id FROM memberships WHERE ';
  const queryParams: any[] = [];

  if (name) {
    query += 'name ILIKE $1::text';
    queryParams.push(`%${name}%`);
  }

  if (barcode) {
    if (name) query += ' OR ';
    query += 'barcode = $2::text OR sub_id = $2::text OR membership_number = $2::integer';
    queryParams.push(barcode);
  }

  query += ' ORDER BY membership_number DESC LIMIT 16';

  const { rows } = await queryDB(query, queryParams);
  return rows;
}

/**
 * Get all members with optional name filter
 */
export async function getAllMembers(name?: string) {
  let query = 'SELECT * FROM memberships';
  const values: any[] = [];

  if (name) {
    query += ' WHERE LOWER(name) LIKE $1';
    values.push(`%${name.toLowerCase()}%`);
  }

  query += ' ORDER BY membership_number DESC;';

  const { rows } = await queryDB(query, values);
  return rows;
}

/**
 * Update a member by membership number
 */
export async function updateMember(
  membershipNumber: number,
  updates: Record<string, any>
) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const addField = (fieldName: string, fieldValue: any) => {
    if (fieldValue !== undefined) {
      fields.push(`${fieldName} = $${idx}`);
      values.push(fieldValue);
      idx++;
    }
  };

  // Add all possible fields
  addField('name', updates.name);
  addField('membership_type', updates.membership_type);
  addField('status', updates.status);
  addField('term', updates.term);
  addField('due_date', updates.due_date);
  addField('contract_end_date', updates.contract_end_date);
  addField('contract_start_date', updates.contract_start_date);
  addField('signup_date', updates.signup_date);
  addField('visits', updates.visits);
  addField('dob', updates.dob);
  addField('age', updates.age);
  addField('last_visit', updates.last_visit);
  addField('address_line_1', updates.address_line_1);
  addField('city_state_zip', updates.city_state_zip);
  addField('comment', updates.comment);
  addField('alert', updates.alert);
  addField('note', updates.note);
  addField('email', updates.email);
  addField('responsible_member', updates.responsible_member);
  addField('barcode', updates.barcode);
  addField('contact', updates.contact);
  addField('valid_until', updates.valid_until);
  addField('sub_id', updates.sub_id);
  addField('customer_id', updates.customer_id);
  addField('_seal_selling_plan_id', updates._seal_selling_plan_id);
  addField('former_sub_id', updates.former_sub_id);
  addField('total_paid', updates.total_paid);
  addField('paid_per_visit', updates.paid_per_visit);
  addField('payments_remaining', updates.payments_remaining);
  addField('valid_starting', updates.valid_starting);

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  const query = `
    UPDATE memberships
    SET ${fields.join(', ')}
    WHERE membership_number = $${idx}
    RETURNING *;
  `;
  values.push(membershipNumber);

  const { rows } = await queryDB(query, values);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get membership details by name, barcode, or email
 */
export async function getMembershipDetails(
  name?: string,
  barcode?: string,
  email?: string
) {
  let membership_number: number | null = null;

  // Check if barcode fits in integer limit for postgres
  if (barcode) {
    const parsedBarcode = parseInt(barcode.toString(), 10);
    if (
      isNaN(parsedBarcode) ||
      parsedBarcode < -2147483648 ||
      parsedBarcode > 2147483647
    ) {
      membership_number = null;
    } else {
      membership_number = parsedBarcode;
    }
  }

  let query = 'SELECT * FROM memberships WHERE ';
  const queryParams: any[] = [];

  if (name) {
    query += 'name ILIKE $1::text';
    queryParams.push(`%${name}%`);
  } else if (barcode) {
    query += 'name ILIKE $1::text';
    queryParams.push(`%${barcode}%`);
  } else {
    query += 'name ILIKE $1::text';
    queryParams.push(`%kjdsngsdjkgnsdf%`);
  }

  if (barcode) {
    query += ' OR ';
    query += 'barcode = $2::text OR sub_id = $2::text';
    queryParams.push(barcode);
  } else if (email) {
    query += ' OR ';
    query += 'email = $2::text';
    queryParams.push(email);
  } else if (name) {
    query += ' OR ';
    query += 'barcode = $2::text';
    queryParams.push(name);
  }

  if (membership_number) {
    query += ' OR ';
    query += 'membership_number = $3::integer';
    queryParams.push(membership_number);
  }

  query += ' ORDER BY membership_number DESC LIMIT 16';

  const { rows } = await queryDB(query, queryParams);
  return rows;
}

/**
 * Get member photo metadata from Google Drive
 */
export async function getMemberPhotoMetadata(membershipNumber: string) {
  const formattedMembershipNumber = membershipNumber.toString().padStart(6, '0');
  const photoFileName = formattedMembershipNumber + '.jpg';
  const folderId = '1-3AFqiWjeNXlcZ1ajYElZD4XkLj3vslK';

  const query = `'${folderId}' in parents and name = '${photoFileName}' and trashed = false`;

  const photo = await drive.files.list({
    q: query,
    fields: 'files(id, name, webContentLink)',
  });

  return photo.data.files && photo.data.files.length > 0
    ? photo.data.files[0]
    : null;
}

/**
 * Get member photo stream from Google Drive
 */
export async function getMemberPhotoStream(membershipNumber: string) {
  const formattedMembershipNumber = membershipNumber.toString().padStart(6, '0');
  const photoFileName = formattedMembershipNumber + '.jpg';
  const folderId = '1-3AFqiWjeNXlcZ1ajYElZD4XkLj3vslK';

  const query = `'${folderId}' in parents and name = '${photoFileName}' and trashed = false`;

  const photo = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  if (photo.data.files && photo.data.files.length > 0) {
    const fileId = photo.data.files[0].id;

    if (!fileId) {
      return null;
    }

    const photoStream = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    );

    return photoStream.data;
  }

  return null;
}

/**
 * Upload member photo to Google Drive
 */
export async function uploadMemberPhoto(
  membershipNumber: string,
  fileBuffer: Buffer,
  mimeType: string
) {
  const formattedMembershipNumber = membershipNumber.toString().padStart(6, '0');
  const photoFileName = `${formattedMembershipNumber}.jpg`;
  const folderId = '1-3AFqiWjeNXlcZ1ajYElZD4XkLj3vslK';

  // Convert buffer to stream
  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  // Check if file exists
  const response = await drive.files.list({
    q: `name='${photoFileName}' and parents in '${folderId}' and trashed=false`,
    spaces: 'drive',
    fields: 'files(id, name)',
  });

  let fileId: string | null | undefined;
  if (response.data.files && response.data.files.length > 0) {
    // File exists, update it
    const existingFileId = response.data.files[0].id;
    if (existingFileId) {
      const file = await drive.files.update({
        fileId: existingFileId,
        media: {
          mimeType: mimeType,
          body: bufferStream,
        },
      });
      fileId = file.data.id;
    }
  } else {
    // File does not exist, create it
    const file = await drive.files.create({
      requestBody: {
        name: photoFileName,
        parents: [folderId],
      },
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
      fields: 'id',
    });
    fileId = file.data.id;
  }

  return fileId;
}

/**
 * Create a new member
 */
export async function createMember(data: {
  name?: string;
  membership_type?: string;
  dob?: string;
  sub_id?: string;
  barcode?: string;
}) {
  const query = `
    INSERT INTO memberships (name, membership_type, dob, sub_id, barcode)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const queryParams = [
    data.name || null,
    data.membership_type || null,
    data.dob || null,
    data.sub_id || null,
    data.barcode || null,
  ];

  const { rows } = await queryDB(query, queryParams);
  return rows[0];
}

/**
 * Edit member basic info
 */
export async function editMember(data: {
  alert?: string;
  valid_until?: string;
  name?: string;
  membership_type?: string;
  dob?: string;
  sub_id?: string;
  barcode?: string;
  membership_number?: number;
}) {
  const query = `
    UPDATE memberships
    SET name = $1, membership_type = $2, dob = $3, sub_id = $4, barcode = $5, valid_until = $7, alert = $8
    WHERE membership_number = $6
    RETURNING *;
  `;
  const queryParams = [
    data.name || null,
    data.membership_type || null,
    data.dob || null,
    data.sub_id || null,
    data.barcode || null,
    data.membership_number || null,
    data.valid_until || null,
    data.alert || null,
  ];

  const { rows } = await queryDB(query, queryParams);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Create a check-in visit
 */
export async function checkin(membershipNumber: number, visitTimestamp: string) {
  const query = `
    INSERT INTO visits (membership_number, visit_timestamp)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const queryParams = [membershipNumber, visitTimestamp];

  const { rows } = await queryDB(query, queryParams);
  return rows[0];
}

/**
 * Delete most recent check-in for a member
 */
export async function deleteRecentCheckin(membershipNumber: number) {
  const query = `
    DELETE FROM visits
    WHERE membership_number = $1
    AND visit_timestamp = (
        SELECT MAX(visit_timestamp)
        FROM visits
        WHERE membership_number = $1
    )
    RETURNING *;
  `;
  const queryParams = [membershipNumber];

  const { rows } = await queryDB(query, queryParams);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Delete a specific visit by ID
 */
export async function deleteVisit(visitId: number) {
  const query = 'DELETE FROM visits WHERE id = $1 RETURNING *;';
  const { rows } = await queryDB(query, [visitId]);
  return rows.length > 0;
}

/**
 * Get visits for multiple membership numbers
 */
export async function getVisits(membershipNumbers: string[]) {
  const query = `
    SELECT * FROM visits
    WHERE membership_number = ANY($1::int[])
    ORDER BY visit_timestamp DESC;
  `;
  const queryParams = [membershipNumbers];

  const { rows } = await queryDB(query, queryParams);
  return rows;
}

/**
 * Get visits for a specific date with member info
 */
export async function getVisitsByDateWithMembers(date: string) {
  const query = `
    SELECT
      v.membership_number,
      v.visit_timestamp,
      v.id AS visit_id,
      m.name,
      m.membership_type
    FROM
      visits v
    JOIN
      memberships m ON v.membership_number = m.membership_number
    WHERE
      DATE(v.visit_timestamp) = $1
    ORDER BY
      v.visit_timestamp DESC;
  `;
  const { rows } = await queryDB(query, [date]);
  return rows;
}

/**
 * Get visits for a date range
 */
export async function getVisitsByDateRange(startDate: Date, endDate: Date) {
  const query = `
    SELECT * FROM visits
    WHERE visit_timestamp >= $1 AND visit_timestamp <= $2
    ORDER BY visit_timestamp DESC;
  `;
  const queryParams = [startDate, endDate];

  const { rows } = await queryDB(query, queryParams);
  return rows;
}

/**
 * Add attendance record
 */
export async function addAttendance(data: {
  category: string;
  quantity: number;
  order_number: string;
  date: string;
}) {
  const query = `
    INSERT INTO attendance (category, quantity, order_number, date)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const queryParams = [data.category, data.quantity, data.order_number, data.date];

  const { rows } = await queryDB(query, queryParams);
  return rows[0];
}

/**
 * Get attendance for a specific date
 */
export async function getAttendance(date: string) {
  const query = `
    SELECT * FROM attendance
    WHERE date = $1
  `;
  const queryParams = [date];

  const { rows } = await queryDB(query, queryParams);
  return rows;
}

/**
 * Cancel attendance for an order number
 */
export async function cancelAttendance(orderNumber: string) {
  const attendanceQuery = `
    UPDATE attendance
    SET cancelled = true
    WHERE order_number = $1
    RETURNING *;
  `;
  const calendarQuery = `
    UPDATE calendar
    SET cancelled = true
    WHERE order_number = $1
    RETURNING *;
  `;
  const queryParams = [orderNumber];

  const attendanceResult = await queryDB(attendanceQuery, queryParams);
  const calendarResult = await queryDB(calendarQuery, queryParams);

  return {
    attendanceRecords: attendanceResult.rows,
    calendarRecords: calendarResult.rows,
  };
}

/**
 * Add calendar attendance
 */
export async function addCalendarAttendance(data: {
  category: string;
  quantity: number;
  order_number: string;
  date: string;
}) {
  const query = `
    INSERT INTO calendar (category, quantity, order_number, date)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const queryParams = [data.category, data.quantity, data.order_number, data.date];

  const { rows } = await queryDB(query, queryParams);
  return rows[0];
}

/**
 * Get calendar attendance for a date range
 */
export async function getCalendarAttendance(startDate: string, endDate: string) {
  const query = `
    SELECT * FROM calendar
    WHERE date >= $1 AND date <= $2
    ORDER BY date ASC;
  `;
  const queryParams = [startDate, endDate];

  const { rows } = await queryDB(query, queryParams);
  return rows;
}

/**
 * Create membership discount code in Shopify
 */
export async function createMembershipDiscount(
  discountCode: string,
  discountAmount: number
) {
  const discountDurationInHours = 30;

  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    basicCodeDiscount: {
      code: discountCode.toString(),
      title: `Discount code ${discountCode}`,
      appliesOncePerCustomer: true,
      customerGets: {
        appliesOnOneTimePurchase: true,
        appliesOnSubscription: true,
        value: {
          discountAmount: {
            amount: discountAmount.toFixed(2),
            appliesOnEachItem: true,
          },
        },
        items: {
          collections: {
            add: ['gid://shopify/Collection/77818036337'],
          },
        },
      },
      customerSelection: {
        all: true,
      },
      startsAt: new Date().toISOString(),
      endsAt: new Date(
        new Date().getTime() + discountDurationInHours * 60 * 60 * 1000
      ).toISOString(),
      usageLimit: 1,
      recurringCycleLimit: 1,
    },
  };

  const response = await fetch(
    'https://zdts-amusement-park.myshopify.com/admin/api/2024-01/graphql.json',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyConfig.accessToken,
      },
      body: JSON.stringify({ query: mutation, variables: variables }),
    }
  );

  const responseData = await response.json();

  if (responseData.data.discountCodeBasicCreate.userErrors.length > 0) {
    const errors = responseData.data.discountCodeBasicCreate.userErrors
      .map((err: any) => err.message)
      .join(', ');
    throw new Error(errors);
  }

  return responseData.data;
}
