/*
  This test catches the race condition where multiple concurrent reservation requests
  read the same available inventory before any of them updates it.

  A naive read-then-write approach would fail because two requests can both see
  availableQuantity = 1, then both proceed to update reservedQuantity, causing
  overselling.

  The atomic WHERE clause in the UPDATE ensures that the availability check and
  reservation increment occur in a single database statement. Only one request
  can satisfy the condition when totalQuantity - reservedQuantity == 1.
*/

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const productId = "product-hub";
  const warehouseId = "warehouse-mumbai";
  const url = "http://localhost:3000/api/reservations";
  const body = JSON.stringify({ productId, warehouseId, quantity: 1 });

  console.log("STEP 1: Reset inventory and release existing test reservations...");

  await prisma.inventory.updateMany({
    where: { productId, warehouseId },
    data: { totalQuantity: 1, reservedQuantity: 0 },
  });

  await prisma.reservation.updateMany({
    where: {
      productId,
      warehouseId,
      status: "PENDING",
    },
    data: {
      status: "RELEASED",
    },
  });

  console.log("STEP 2: Sending 20 concurrent reservation requests...");

  const requests = Array.from({ length: 20 }, () =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
  );

  const results = await Promise.allSettled(requests);

  const responses = await Promise.all(
    results.map(async (result) => {
      if (result.status === "fulfilled") {
        const response = result.value;
        return { status: response.status, body: await response.text() };
      }
      return { status: 0, body: String(result.reason) };
    })
  );

  const successCount = responses.filter((r) => r.status === 201).length;
  const conflictCount = responses.filter((r) => r.status === 409).length;
  const otherCount = responses.filter((r) => r.status !== 201 && r.status !== 409).length;

  const inventory = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId,
        warehouseId,
      },
    },
  });

  const reservedQuantity = inventory?.reservedQuantity ?? null;

  console.log("STEP 3: Results");
  console.log(`  successes: ${successCount}`);
  console.log(`  conflicts: ${conflictCount}`);
  console.log(`  other statuses: ${otherCount}`);
  console.log(`  reservedQuantity: ${reservedQuantity}`);

  console.log("STEP 4: Assertions");

  const errorCount = responses.filter((r) => r.status !== 201 && r.status !== 409).length;
  const statusCounts = responses.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  let failed = false;

  if (successCount === 1) {
    console.log("PASS: Exactly 1 request succeeded");
  } else {
    console.error(`FAIL: Expected 1 success, got ${successCount}`);
    failed = true;
  }

  if (reservedQuantity === 1) {
    console.log("PASS: reservedQuantity is exactly 1 (not oversold)");
  } else {
    console.error(`FAIL: Expected reservedQuantity 1, got ${reservedQuantity}`);
    failed = true;
  }

  const infoMessage = `INFO: ${conflictCount + errorCount} requests rejected (` +
    `${conflictCount} via 409, ${errorCount} via 500/timeout or other errors)`;
  console.log(infoMessage);

  console.log("STEP 5: Cleanup");

  await prisma.$executeRawUnsafe(
    `UPDATE "Inventory" SET "totalQuantity" = $1, "reservedQuantity" = $2, "updatedAt" = NOW()
     WHERE "productId" = $3 AND "warehouseId" = $4`,
    1,
    0,
    productId,
    warehouseId
  );

  await prisma.$executeRawUnsafe(
    `UPDATE "Reservation" SET "status" = 'RELEASED', "updatedAt" = NOW()
     WHERE "productId" = $1 AND "warehouseId" = $2 AND "status" = 'PENDING'`,
    productId,
    warehouseId
  );

  if (failed) {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
