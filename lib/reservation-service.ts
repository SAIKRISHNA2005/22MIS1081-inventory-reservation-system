import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  InsufficientStockError,
  ReservationNotFoundError,
  ReservationExpiredError,
  ReservationAlreadyProcessedError,
} from "@/lib/errors";

export type ReservationWithDetails = Prisma.ReservationGetPayload<{
  include: { product: true; warehouse: true };
}>;

/*
 * WHY NO $transaction() WRAPPER on createReservation:
 * Prisma's interactive transactions hold a real PostgreSQL connection open for the
 * entire async callback. Under concurrent load this can exhaust the connection pool.
 *
 * The atomic safety comes from the SQL UPDATE WHERE clause itself — PostgreSQL
 * guarantees that a single UPDATE statement is atomic.
 */

export async function createReservation({
  productId,
  warehouseId,
  quantity,
}: {
  productId: string;
  warehouseId: string;
  quantity: number;
}): Promise<ReservationWithDetails> {
  const updated = await db.$executeRaw`
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

  try {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    return await db.reservation.create({
      data: { productId, warehouseId, quantity, status: "PENDING", expiresAt },
      include: { product: true, warehouse: true },
    });
  } catch (err) {
    await db.$executeRaw`
      UPDATE "Inventory"
      SET "reservedQuantity" = "reservedQuantity" - ${quantity},
          "updatedAt" = NOW()
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
    `;
    throw err;
  }
}

export async function getReservation(id: string): Promise<ReservationWithDetails> {
  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { product: true, warehouse: true },
  });

  if (!reservation) throw new ReservationNotFoundError();

  if (reservation.status === "PENDING" && reservation.expiresAt < new Date()) {
    const released = await releaseReservation(id);
    if (!released) throw new ReservationNotFoundError();
    return released;
  }

  return reservation;
}

export async function confirmReservation(id: string): Promise<ReservationWithDetails> {
  return await db.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });
    if (!reservation) throw new ReservationNotFoundError();
    if (reservation.status === "CONFIRMED") throw new ReservationAlreadyProcessedError("CONFIRMED");
    if (reservation.status === "RELEASED") throw new ReservationAlreadyProcessedError("RELEASED");
    if (reservation.expiresAt < new Date()) {
      await tx.$executeRaw`
        UPDATE "Inventory"
        SET "reservedQuantity" = "reservedQuantity" - ${reservation.quantity}
        WHERE "productId" = ${reservation.productId}
          AND "warehouseId" = ${reservation.warehouseId}
      `;
      await tx.reservation.update({ where: { id }, data: { status: "RELEASED" } });
      throw new ReservationExpiredError();
    }

    await tx.$executeRaw`
      UPDATE "Inventory"
      SET "totalQuantity" = "totalQuantity" - ${reservation.quantity},
          "reservedQuantity" = "reservedQuantity" - ${reservation.quantity}
      WHERE "productId" = ${reservation.productId}
        AND "warehouseId" = ${reservation.warehouseId}
    `;

    return await tx.reservation.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: { product: true, warehouse: true },
    });
  });
}

export async function releaseReservation(id: string): Promise<ReservationWithDetails | null> {
  return await db.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });
    if (!reservation) throw new ReservationNotFoundError();

    if (reservation.status !== "PENDING") {
      return await tx.reservation.findUnique({
        where: { id },
        include: { product: true, warehouse: true },
      });
    }

    await tx.$executeRaw`
      UPDATE "Inventory"
      SET "reservedQuantity" = "reservedQuantity" - ${reservation.quantity}
      WHERE "productId" = ${reservation.productId}
        AND "warehouseId" = ${reservation.warehouseId}
    `;

    return await tx.reservation.update({
      where: { id },
      data: { status: "RELEASED" },
      include: { product: true, warehouse: true },
    });
  });
}
