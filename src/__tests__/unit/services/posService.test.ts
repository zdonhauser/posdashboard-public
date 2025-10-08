/**
 * Unit tests for POS Service
 */

import * as posService from "../../../services/posService";
import { queryDB } from "../../../config/database";

// Mock database
jest.mock("../../../config/database");
const mockQueryDB = queryDB as jest.MockedFunction<typeof queryDB>;

describe("POS Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPLUItems", () => {
    it("should get all PLU items without filter", async () => {
      const mockRows = [
        { id: 1, title: "Item 1", original_unit_price: 10.0 },
        { id: 2, title: "Item 2", original_unit_price: 20.0 },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await posService.getPLUItems();

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM plu_list")
      );
      expect(result).toHaveLength(2);
      expect(result[0].price).toBe(10.0);
      expect(result[0].quantity).toBe(1);
    });

    it("should filter PLU items by group", async () => {
      const mockRows = [{ id: 1, title: "Item 1", original_unit_price: 10.0 }];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await posService.getPLUItems("5");

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('WHERE "group_" = 5')
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("modifyPLUItem", () => {
    it("should modify a PLU item", async () => {
      const mockRow = { id: 1, title: "Updated Item", original_unit_price: 15.0 };

      mockQueryDB.mockResolvedValueOnce({ rows: [mockRow] } as any);

      const result = await posService.modifyPLUItem("1", {
        title: "Updated Item",
        original_unit_price: 15.0,
      });

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE plu_list SET"),
        expect.arrayContaining(["Updated Item", 15.0, "1"])
      );
      expect(result).toEqual(mockRow);
    });

    it("should throw error when ID is missing", async () => {
      await expect(posService.modifyPLUItem("", { title: "Test" })).rejects.toThrow(
        "Missing PLU item ID"
      );
    });

    it("should throw error when no fields to update", async () => {
      await expect(posService.modifyPLUItem("1", {})).rejects.toThrow(
        "No fields provided to update"
      );
    });

    it("should throw error when item not found", async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      await expect(
        posService.modifyPLUItem("999", { title: "Test" })
      ).rejects.toThrow("PLU item not found");
    });
  });

  describe("updatePLUItemColor", () => {
    it("should update PLU item color", async () => {
      const mockRow = { id: 1, color: "blue" };

      mockQueryDB.mockResolvedValueOnce({ rows: [mockRow] } as any);

      const result = await posService.updatePLUItemColor("1", "blue");

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE plu_list SET color"),
        ["blue", "1"]
      );
      expect(result).toEqual(mockRow);
    });

    it("should throw error when item not found", async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      await expect(posService.updatePLUItemColor("999", "red")).rejects.toThrow(
        "PLU item not found"
      );
    });
  });

  describe("getPOSByTab", () => {
    it("should get all POS tabs without filter", async () => {
      const mockRows = [
        {
          id: 1,
          original_unit_price: 10.0,
          mod_class: 100,
          num_of_mods_req: 2,
          group_: 5,
          category: "food",
          discount_type: null,
          add_price: 0,
          line_item_id: "l1",
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await posService.getPOSByTab();

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("FROM pos_tabs"),
        []
      );
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(10.0);
      expect(result[0].modClass).toBe(100);
      expect(result[0].vendor).toBe("food");
    });

    it("should filter POS tabs by tab ID", async () => {
      const mockRows = [{ id: 1, original_unit_price: 10.0 }];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await posService.getPOSByTab("tab1");

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("WHERE pos_tabs.tab_id = $1"),
        ["tab1"]
      );
    });
  });

  describe("createBarcode", () => {
    it("should create a barcode", async () => {
      const mockRow = { id: 1, barcode: "123456", plu_id: "1" };

      mockQueryDB.mockResolvedValueOnce({ rows: [mockRow] } as any);

      const result = await posService.createBarcode("123456", "1");

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO barcodes"),
        ["123456", "1"]
      );
      expect(result).toEqual(mockRow);
    });

    it("should throw error when barcode is missing", async () => {
      await expect(posService.createBarcode("", "1")).rejects.toThrow(
        "Barcode and PLU ID are required."
      );
    });

    it("should throw error when plu_id is missing", async () => {
      await expect(posService.createBarcode("123456", "")).rejects.toThrow(
        "Barcode and PLU ID are required."
      );
    });
  });

  describe("searchByBarcode", () => {
    it("should find item by barcode", async () => {
      const mockRow = {
        id: 1,
        barcode: "123456",
        original_unit_price: 10.0,
        mod_class: 100,
        num_of_mods_req: 2,
        group_: 5,
        discount_type: null,
        add_price: 0,
        line_item_id: "l1",
      };

      mockQueryDB.mockResolvedValueOnce({ rows: [mockRow] } as any);

      const result = await posService.searchByBarcode("123456");

      expect(result).toBeTruthy();
      expect(result?.price).toBe(10.0);
      expect(result?.sku).toBe("1");
    });

    it("should return null when barcode not found", async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      const result = await posService.searchByBarcode("999999");

      expect(result).toBeNull();
    });

    it("should throw error when barcode is missing", async () => {
      await expect(posService.searchByBarcode("")).rejects.toThrow(
        "Barcode is required."
      );
    });
  });

  describe("getPOSMods", () => {
    it("should get POS mods by mod classes", async () => {
      const mockRows = [
        {
          id: 1,
          mod_class: 1500,
          title: "Mod A",
          original_unit_price: 5.0,
          num_of_mods_req: 1,
          discount_type: null,
          add_price: 0,
          line_item_id: "l1",
        },
        {
          id: 2,
          mod_class: 2500,
          title: "Mod B",
          original_unit_price: 3.0,
          num_of_mods_req: 1,
          discount_type: null,
          add_price: 0,
          line_item_id: "l2",
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await posService.getPOSMods("1,2");

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("UNION ALL"),
        [1000, 1999, 2000, 2999]
      );
      expect(result[1]).toHaveLength(1);
      expect(result[2]).toHaveLength(1);
      expect(result[1][0].isMod).toBe(true);
    });

    it("should sort mods alphabetically", async () => {
      const mockRows = [
        { id: 1, mod_class: 1500, title: "Zebra", original_unit_price: 5.0 },
        { id: 2, mod_class: 1600, title: "Apple", original_unit_price: 3.0 },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await posService.getPOSMods("1");

      expect(result[1][0].title).toBe("Apple");
      expect(result[1][1].title).toBe("Zebra");
    });
  });

  describe("getMods", () => {
    it("should get mods by mod classes", async () => {
      const mockRows = [
        {
          id: 1,
          title: "Mod 1",
          original_unit_price: 5.0,
          num_of_mods_req: 1,
          mod: 100,
          discount_type: null,
          add_price: 0,
          mod_type: "required",
          line_item_id: "l1",
          variant_id: "v1",
          function: null,
          max_quantity: null,
          max_modClass: null,
          mod_class: 1000,
          color: "red",
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await posService.getMods("100,200");

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("WHERE mod = ANY($1::int[])"),
        [[100, 200]]
      );
      expect(result).toHaveLength(1);
      expect(result[0].isMod).toBe(true);
      expect(result[0].price).toBe(5.0);
    });

    it("should throw error when modClasses is missing", async () => {
      await expect(posService.getMods("")).rejects.toThrow(
        "Invalid or missing modClasses parameter"
      );
    });
  });
});
