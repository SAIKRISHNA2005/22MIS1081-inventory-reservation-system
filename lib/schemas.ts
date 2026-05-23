import { z } from "zod";

export const WarehouseSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
});

export const InventoryEntrySchema = z.object({
  warehouseId: z.string(),
  warehouseName: z.string(),
  totalQuantity: z.number(),
  reservedQuantity: z.number(),
  availableQuantity: z.number(),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  warehouses: z.array(InventoryEntrySchema),
});

export const CreateReservationSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive().max(100),
});
