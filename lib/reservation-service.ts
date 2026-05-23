import { db } from "@/lib/db";
import {
  InsufficientStockError,
  ReservationNotFoundError,
  ReservationExpiredError,
  ReservationAlreadyProcessedError,
} from "@/lib/errors";

/*
 * WHY NO $transaction() WRAPPER:
 * Prisma's interactive transactions (db.$transaction(async callback)) hold a real
 * PostgreSQL connection open for the entire async callback. Under 20 concurrent
 * requests this exhausts Supabase free tier's connection pool and causes P2028 errors.
 *
 * The atomic safety comes from the SQL UPDATE WHERE clause itself — PostgreSQL
 * guarantees that a single UPDATE statement is atomic. No transaction wrapper needed
 * for a single statement. The $executeRawUnsafe calls below use the simple query
 * protocol (no prepared statements) which is compatible with PgBouncer pooling.
 */

export async function createReservation({
  productId,
  warehouseId,
  quantity,
}: {
  productId: string;
  warehouseId: string;
  quantity: number;
}) {
  /*
   * ATOMIC CONDITIONAL UPDATE — the core of oversell prevention.
   * The availability check ((totalQuantity - reservedQuantity) >= quantity)
   * and the increment happen in ONE atomic SQL statement.
   *
   * If two requests compete for the last unit:
   *   - PostgreSQL processes them serially at the row level
   *   - Only ONE satisfies the WHERE clause and updates the row
   *   - The other gets updatedRows = 0 → returns 409
   * No race condition is possible because read and write are the same operation.
   */
  const updated = await db.$executeRawUnsafe(
    `UPDATE "Inventory"
     SET "reservedQuantity" = "reservedQuantity" + $1,
         "updatedAt" = NOW()
     WHERE "productId" = $2
       AND "warehouseId" = $3
       AND ("totalQuantity" - "reservedQuantity") >= $4`,
    quantity,
    productId,
    warehouseId,
    quantity
  );

  if (updated === 0) {
    throw new InsufficientStockError();
  }

  try {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = await db.reservation.create({
      data: { productId, warehouseId, quantity, status: "PENDING", expiresAt },
      include: { product: true, warehouse: true },
    });
    return reservation;
  } catch (err) {
    await db.$executeRawUnsafe(
      `UPDATE "Inventory"
       SET "reservedQuantity" = "reservedQuantity" - $1,
           "updatedAt" = NOW()
       WHERE "productId" = $2
         AND "warehouseId" = $3`,
      quantity,
      productId,
      warehouseId
    );
    throw err;
  }
}

export async function getReservation(id: string) {
  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { product: true, warehouse: true },
  });
  if (!reservation) throw new ReservationNotFoundError();

  if (reservation.status === "PENDING" && reservation.expiresAt < new Date()) {
    return await releaseReservation(id);
  }
  return reservation;
}

export async function confirmReservation(id: string) {
  const reservation = await db.reservation.findUnique({ where: { id } });
  if (!reservation) throw new ReservationNotFoundError();
  if (reservation.status === "CONFIRMED") throw new ReservationAlreadyProcessedError("CONFIRMED");
  if (reservation.status === "RELEASED") throw new ReservationAlreadyProcessedError("RELEASED");
  if (reservation.expiresAt < new Date()) {
    await db.$executeRawUnsafe(
      `UPDATE "Inventory"
       SET "reservedQuantity" = "reservedQuantity" - $1,
           "updatedAt" = NOW()
       WHERE "productId" = $2
         AND "warehouseId" = $3`,
      reservation.quantity,
      reservation.productId,
      reservation.warehouseId
    );
    await db.reservation.update({ where: { id }, data: { status: "RELEASED" } });
    throw new ReservationExpiredError();
  }

  await db.$executeRawUnsafe(
    `UPDATE "Inventory"
     SET "totalQuantity" = "totalQuantity" - $1,
         "reservedQuantity" = "reservedQuantity" - $2,
         "updatedAt" = NOW()
     WHERE "productId" = $3
       AND "warehouseId" = $4`,
    reservation.quantity,
    reservation.quantity,
    reservation.productId,
    reservation.warehouseId
  );

  return await db.reservation.update({
    where: { id },
    data: { status: "CONFIRMED" },
    include: { product: true, warehouse: true },
  });
}

export async function releaseReservation(id: string) {
  const reservation = await db.reservation.findUnique({ where: { id } });
  if (!reservation) throw new ReservationNotFoundError();

  if (reservation.status !== "PENDING") {
    return await db.reservation.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });
  }

  await db.$executeRawUnsafe(
    `UPDATE "Inventory"
     SET "reservedQuantity" = "reservedQuantity" - $1,
         "updatedAt" = NOW()
     WHERE "productId" = $2
       AND "warehouseId" = $3`,
    reservation.quantity,
    reservation.productId,
    reservation.warehouseId
  );

  return await db.reservation.update({
    where: { id },
    data: { status: "RELEASED" },
    include: { product: true, warehouse: true },
  });
}
