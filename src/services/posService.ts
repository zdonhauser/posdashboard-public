/**
 * POS Service
 * Handles business logic for POS and PLU item operations
 */

import { queryDB } from "@config/database";

/**
 * Get PLU items, optionally filtered by group
 */
export async function getPLUItems(groupNumber?: string): Promise<any[]> {
  let query = "SELECT * FROM plu_list";
  if (groupNumber) {
    query += ` WHERE "group_" = ${groupNumber}`;
  }
  query += " LIMIT 25";

  const result = await queryDB(query);
  const pluItems = result.rows.map((row) => {
    const item = { ...row };
    item.quantity = 1;
    item.price = row.original_unit_price;
    item.id = row.id;
    return item;
  });

  return pluItems;
}

/**
 * Modify a PLU item
 */
export async function modifyPLUItem(
  id: string,
  fieldsToUpdate: Record<string, any>
): Promise<any> {
  if (!id) {
    throw new Error("Missing PLU item ID");
  }

  // Build the UPDATE query dynamically based on provided fields
  let query = "UPDATE plu_list SET ";
  const setClauses: string[] = [];
  const values: any[] = [];
  let index = 1;

  // Loop through the fields and add them as parameterized clauses
  for (const key in fieldsToUpdate) {
    setClauses.push(`"${key}" = $${index}`);
    values.push(fieldsToUpdate[key]);
    index++;
  }

  if (setClauses.length === 0) {
    throw new Error("No fields provided to update");
  }

  query += setClauses.join(", ");
  query += ` WHERE id = $${index} RETURNING *`;
  values.push(id);

  const result = await queryDB(query, values);
  if (result.rows.length === 0) {
    throw new Error("PLU item not found");
  }

  return result.rows[0];
}

/**
 * Update PLU item color by ID
 */
export async function updatePLUItemColor(
  id: string,
  color: string
): Promise<any> {
  const result = await queryDB(
    "UPDATE plu_list SET color = $1 WHERE id = $2 RETURNING *",
    [color, id]
  );

  if (result.rows.length === 0) {
    throw new Error("PLU item not found");
  }

  return result.rows[0];
}

/**
 * Get POS tabs, optionally filtered by tab ID
 */
export async function getPOSByTab(tab?: string): Promise<any[]> {
  const query = `
    SELECT pos_tabs.*, plu_list.*
    FROM pos_tabs
    LEFT JOIN plu_list ON pos_tabs.plu_id = plu_list.id
    ${tab ? `WHERE pos_tabs.tab_id = $1` : ``}
    ORDER BY pos_tabs.position ASC
  `;

  const result = await queryDB(query, tab ? [tab] : []);
  const posTabs = result.rows.map((row) => {
    const item = { ...row };
    return {
      ...item,
      sku: String(row.id),
      price: row.original_unit_price,
      quantity: 1,
      modClass: row.mod_class || 0,
      numOfMods: row.num_of_mods_req || 0,
      group: row.group_ || 0,
      vendor: row.category || "admission",
      fullPrice: row.original_unit_price || 0,
      discountType: row.discount_type,
      addPrice: row.add_price,
      id: row.line_item_id,
    };
  });

  return posTabs;
}

/**
 * Create a barcode
 */
export async function createBarcode(
  barcode: string,
  plu_id: string
): Promise<any> {
  if (!barcode || !plu_id) {
    throw new Error("Barcode and PLU ID are required.");
  }

  const query = `
    INSERT INTO barcodes (barcode, plu_id)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [barcode, plu_id];
  const result = await queryDB(query, values);

  return result.rows[0];
}

/**
 * Search by barcode
 */
export async function searchByBarcode(barcode: string): Promise<any | null> {
  if (!barcode) {
    throw new Error("Barcode is required.");
  }

  const query = `
    SELECT b.barcode, p.*
    FROM barcodes b
    JOIN plu_list p ON b.plu_id = p.id
    WHERE b.barcode = $1;
  `;
  const values = [barcode];
  const result = await queryDB(query, values);

  if (result.rows.length > 0) {
    const row = result.rows[0];
    const item = { ...row };
    return {
      ...item,
      sku: String(row.id),
      price: row.original_unit_price || 0,
      quantity: 1,
      modClass: row.mod_class || 0,
      numOfMods: row.num_of_mods_req || 0,
      group: row.group_ || 0,
      fullPrice: row.original_unit_price || 0,
      discountType: row.discount_type || null,
      addPrice: row.add_price || 0,
      id: row.line_item_id || null,
    };
  }

  return null;
}

/**
 * Get POS mods by mod classes
 */
export async function getPOSMods(modclasses: string): Promise<Record<number, any[]>> {
  const modclassArray = modclasses
    .split(",")
    .map((cls) => parseInt(cls.trim(), 10))
    .filter((cls) => !isNaN(cls));

  const rangeQueries = modclassArray
    .map(
      (modclass, i) => `
      SELECT *
      FROM plu_list
      WHERE mod_class BETWEEN $${i * 2 + 1} AND $${i * 2 + 2}
    `
    )
    .join(" UNION ALL ");

  const params = modclassArray.flatMap((modclass) => [
    modclass * 1000,
    (modclass + 1) * 1000 - 1,
  ]);

  const result = await queryDB(rangeQueries, params);

  const groupedMods: Record<number, any[]> = {};

  for (const row of result.rows) {
    const group = Math.floor(row.mod_class / 1000);

    const item = {
      ...row,
      price: row.original_unit_price || 0,
      numOfMods: row.num_of_mods_req || 0,
      modClass: row.mod_class || 0,
      discountType: row.discount_type || null,
      isMod: true,
      addPrice: row.add_price || 0,
      sku: row.id || null,
      id: row.line_item_id || null,
    };

    if (!groupedMods[group]) groupedMods[group] = [];
    groupedMods[group].push(item);
  }

  Object.values(groupedMods).forEach((mods: any[]) =>
    mods.sort((a, b) => a.title.localeCompare(b.title))
  );

  return groupedMods;
}

/**
 * Get mods by mod classes
 */
export async function getMods(modClasses: string): Promise<any[]> {
  if (!modClasses) {
    throw new Error("Invalid or missing modClasses parameter");
  }

  const modClassIntegers = modClasses.split(",").map(Number);

  const query = `
    SELECT *
    FROM plu_list
    WHERE mod = ANY($1::int[])
  `;

  const result = await queryDB(query, [modClassIntegers]);
  const posTabs = result.rows.map((row) => {
    const item = { ...row };
    return {
      ...item,
      title: row.title || "",
      price: row.original_unit_price || 0,
      numOfMods: row.num_of_mods_req || 0,
      mod: row.mod || null,
      discountType: row.discount_type || null,
      isMod: true,
      addPrice: row.add_price || 0,
      mod_type: row.mod_type || null,
      id: row.line_item_id || null,
      variant_id: row.variant_id || null,
      function: row.function || null,
      max_quantity: row.max_quantity || null,
      max_modClass: row.max_modClass || null,
      mod_class: row.mod_class || null,
      color: row.color || null,
    };
  });

  return posTabs;
}
