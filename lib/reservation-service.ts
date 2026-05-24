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

/*
 * confirm/release use single-statement CTE updates (no $transaction).
 * Prisma interactive transactions break behind Supabase/Neon transaction-mode
 * PgBouncer (port 6543), which is what Vercel serverless must use.
 */
export async function confirmReservation(id: string): Promise<ReservationWithDetails> {
  type ConfirmRow = { id: string };
  const confirmed = await db.$queryRaw<ConfirmRow[]>`
    WITH confirmed AS (
      UPDATE "Reservation"
      SET status = 'CONFIRMED', "updatedAt" = NOW()
      WHERE id = ${id}
        AND status = 'PENDING'
        AND "expiresAt" >= NOW()
      RETURNING id, "productId", "warehouseId", quantity
    )
    UPDATE "Inventory" i
    SET "totalQuantity" = i."totalQuantity" - c.quantity,
        "reservedQuantity" = i."reservedQuantity" - c.quantity,
        "updatedAt" = NOW()
    FROM confirmed c
    WHERE i."productId" = c."productId" AND i."warehouseId" = c."warehouseId"
    RETURNING c.id
  `;

  if (confirmed.length > 0) {
    const result = await db.reservation.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });
    if (!result) throw new ReservationNotFoundError();
    return result;
  }

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { product: true, warehouse: true },
  });
  if (!reservation) throw new ReservationNotFoundError();
  if (reservation.status === "CONFIRMED") throw new ReservationAlreadyProcessedError("CONFIRMED");
  if (reservation.status === "RELEASED") throw new ReservationAlreadyProcessedError("RELEASED");

  if (reservation.status === "PENDING" && reservation.expiresAt < new Date()) {
    await releaseReservation(id);
    throw new ReservationExpiredError();
  }

  throw new ReservationNotFoundError();
}

export async function releaseReservation(id: string): Promise<ReservationWithDetails | null> {
  type ReleaseRow = { id: string };
  const released = await db.$queryRaw<ReleaseRow[]>`
    WITH released AS (
      UPDATE "Reservation"
      SET status = 'RELEASED', "updatedAt" = NOW()
      WHERE id = ${id} AND status = 'PENDING'
      RETURNING id, "productId", "warehouseId", quantity
    )
    UPDATE "Inventory" i
    SET "reservedQuantity" = i."reservedQuantity" - r.quantity,
        "updatedAt" = NOW()
    FROM released r
    WHERE i."productId" = r."productId" AND i."warehouseId" = r."warehouseId"
    RETURNING r.id
  `;

  if (released.length > 0) {
    const result = await db.reservation.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });
    if (!result) throw new ReservationNotFoundError();
    return result;
  }

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { product: true, warehouse: true },
  });
  if (!reservation) throw new ReservationNotFoundError();
  return reservation;
}
