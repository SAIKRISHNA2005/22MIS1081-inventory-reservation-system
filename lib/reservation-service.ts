import { db } from "@/lib/db";
import { InsufficientStockError } from "@/lib/errors";

export async function createReservation({
  productId,
  warehouseId,
  quantity,
}: {
  productId: string;
  warehouseId: string;
  quantity: number;
}) {
  return await db.$transaction(async (tx) => {
    const updated = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "reservedQuantity" = "reservedQuantity" + ${quantity},
          "updatedAt" = NOW()
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        AND ("totalQuantity" - "reservedQuantity") >= ${quantity}
    `;

    if (updated === 0) {
      throw new InsufficientStockError();
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const reservation = await tx.reservation.create({
      data: { productId, warehouseId, quantity, status: "PENDING", expiresAt },
      include: { product: true, warehouse: true },
    });

    return reservation;
  });
}
