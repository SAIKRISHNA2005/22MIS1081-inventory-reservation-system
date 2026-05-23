import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const products = await db.product.findMany({
    include: {
      inventories: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  const result = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    warehouses: product.inventories.map((inventory) => ({
      warehouseId: inventory.warehouseId,
      warehouseName: inventory.warehouse.name,
      totalQuantity: inventory.totalQuantity,
      reservedQuantity: inventory.reservedQuantity,
      availableQuantity: inventory.totalQuantity - inventory.reservedQuantity,
    })),
  }));

  return NextResponse.json(result);
}
