/**
 * KDS (Kitchen Display System) Service
 * Handles all KDS-related business logic and database operations
 */

import { queryDB } from '@config/database';

export interface KDSOrderItem {
  item_name: string;
  quantity: number;
  station: string;
  special_instructions?: string;
  prepared_quantity?: number;
  fulfilled_quantity?: number;
}

export interface KDSOrder {
  pos_order_id: string;
  order_number: string;
  items: KDSOrderItem[];
  status: string;
  name?: string;
}

/**
 * Get KDS orders with optional filtering
 */
export async function getKDSOrders(
  status?: string,
  status2?: string,
  orderBy?: string
): Promise<any> {
  // Build a WHERE clause: if status != 'all', filter by status and optional status2
  let whereClause = "";
  if (status && status.toLowerCase() !== "all") {
    const statusFilter = `o.status = '${status}'`;
    const status2Filter =
      status2 && status2 !== "" ? ` OR o.status = '${status2}'` : "";
    whereClause = `WHERE (${statusFilter}${status2Filter})`;
  }

  // Validate order_by, defaulting to ordering by o.id ASC
  const validOrderBy = ["id", "created_at", "updated_at"];
  const orderByClause =
    orderBy && validOrderBy.includes(orderBy)
      ? `ORDER BY o.${orderBy} DESC`
      : "ORDER BY o.id ASC";

  // Query using JSON aggregation - each order row includes an "items" array
  const query = `
    SELECT
      o.id as id,
      o.pos_order_id,
      o.order_number,
      o.status,
      o.front_released,
      o.is_fulfilled,
      o.name,
      o.created_at,
      o.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', i.id,
            'item_name', i.item_name,
            'quantity', i.quantity,
            'prepared_quantity', i.prepared_quantity,
            'fulfilled_quantity', i.fulfilled_quantity,
            'station', i.station,
            'special_instructions', i.special_instructions,
            'created_at', i.created_at,
            'updated_at', i.updated_at
          )
          ORDER BY i.id ASC
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'
      ) AS items
    FROM kitchen_orders o
    LEFT JOIN kitchen_order_items i ON o.id = i.kitchen_order_id
    ${whereClause}
    GROUP BY o.id
    ${orderByClause}
    LIMIT 100
  `;

  const result = await queryDB(query);
  return result.rows;
}

/**
 * Create a new KDS order with items
 */
export async function createKDSOrder(order: KDSOrder): Promise<any> {
  const { pos_order_id, order_number, items, status, name } = order;

  if (!pos_order_id || !order_number || !Array.isArray(items)) {
    throw new Error("Invalid payload: pos_order_id, order_number, and items are required");
  }

  // Insert a new row into kitchen_orders
  const orderQuery = `
    INSERT INTO kitchen_orders (pos_order_id, order_number, status, front_released, is_fulfilled, name)
    VALUES ($1, $2, $3, false, false, $4)
    RETURNING id
  `;
  const orderResult = await queryDB(orderQuery, [
    pos_order_id,
    order_number,
    status,
    name || null
  ]);
  const kitchenOrderId = orderResult.rows[0].id;

  // Insert items if present
  if (items.length > 0) {
    const valueClauses = items
      .map(
        (_item, index) =>
          `($${index * 7 + 1}, $${index * 7 + 2}, $${index * 7 + 3}, $${index * 7 + 4}, $${index * 7 + 5}, $${index * 7 + 6}, $${index * 7 + 7})`
      )
      .join(", ");

    const values = items.flatMap((item) => [
      kitchenOrderId,
      item.item_name,
      item.quantity,
      item.station,
      item.special_instructions || null,
      item.prepared_quantity !== undefined ? item.prepared_quantity : 0,
      item.fulfilled_quantity !== undefined ? item.fulfilled_quantity : 0,
    ]);

    const itemsQuery = `
      INSERT INTO kitchen_order_items
        (kitchen_order_id, item_name, quantity, station, special_instructions, prepared_quantity, fulfilled_quantity)
      VALUES ${valueClauses}
    `;
    await queryDB(itemsQuery, values);
  }

  return {
    success: true,
    kitchen_order_id: kitchenOrderId,
  };
}

/**
 * Update KDS item status
 */
export async function updateKDSItemStatus(
  itemId: string,
  status: string
): Promise<any> {
  const validStatuses = ["mark-prepared", "mark-fulfilled", "unmark", "mark-pending"];
  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid status, must be one of: ${validStatuses.join(", ")}`
    );
  }

  const updateQuery = `
    UPDATE kitchen_order_items
    SET prepared_quantity = (
      CASE $2
        WHEN 'mark-prepared' THEN quantity
        WHEN 'mark-fulfilled' THEN quantity
        WHEN 'unmark' THEN 0
        WHEN 'mark-pending' THEN 0
        ELSE prepared_quantity
      END
    ),
    fulfilled_quantity = (
      CASE $2
        WHEN 'mark-fulfilled' THEN quantity
        WHEN 'unmark' THEN 0
        WHEN 'mark-pending' THEN 0
        WHEN 'mark-prepared' THEN 0
        ELSE fulfilled_quantity
      END
    ),
    updated_at = (CASE $2 WHEN 'mark-prepared' THEN NOW() ELSE updated_at END)
    WHERE id = $1
    RETURNING id, prepared_quantity, fulfilled_quantity, quantity
  `;
  const result = await queryDB(updateQuery, [itemId, status]);

  if (result.rowCount === 0) {
    throw new Error("Item is already fully prepared or does not exist");
  }

  return {
    success: true,
    item: result.rows,
  };
}

/**
 * Update KDS order status
 */
export async function updateKDSOrderStatus(
  orderId: string,
  status: string,
  skipItemUpdate: boolean = false
): Promise<any> {
  const validStatuses = ["ready", "fulfilled", "pending"];
  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid status, must be one of: ${validStatuses.join(", ")}`
    );
  }

  await queryDB("BEGIN");

  try {
    // Apply item-level updates based on order status
    if (status === "ready" && !skipItemUpdate) {
      await queryDB(
        `
        UPDATE kitchen_order_items
        SET prepared_quantity = quantity,
            updated_at = NOW()
        WHERE kitchen_order_id = $1 AND prepared_quantity = 0
        `,
        [orderId]
      );
    } else if (status === "fulfilled" && !skipItemUpdate) {
      await queryDB(
        `
        UPDATE kitchen_order_items
        SET prepared_quantity = quantity,
            fulfilled_quantity = quantity,
            updated_at = NOW()
        WHERE kitchen_order_id = $1
        `,
        [orderId]
      );
    } else if (status === "pending" && !skipItemUpdate) {
      await queryDB(
        `
        UPDATE kitchen_order_items
        SET prepared_quantity = 0,
            fulfilled_quantity = 0,
            updated_at = NOW()
        WHERE kitchen_order_id = $1
        `,
        [orderId]
      );
    }

    // Update the kitchen_orders row
    const updateOrderQuery = `
      UPDATE kitchen_orders
      SET status = $2::order_status, updated_at = NOW()
      WHERE id = $1 OR pos_order_id = $1
      RETURNING *
    `;
    const result = await queryDB(updateOrderQuery, [orderId, status]);

    if (result.rowCount === 0) {
      await queryDB("ROLLBACK");
      throw new Error("Order not found");
    }

    await queryDB("COMMIT");

    return {
      success: true,
      order: result.rows[0],
    };
  } catch (error) {
    await queryDB("ROLLBACK");
    throw error;
  }
}
