import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const ReservationSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive().max(100),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ReservationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reservation request" }, { status: 400 });
  }

  const { productId, warehouseId, quantity } = parsed.data;

  const inventory = await db.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId,
        warehouseId,
      },
    },
  });

  if (!inventory) {
    return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
  }

  const availableQuantity = inventory.totalQuantity - inventory.reservedQuantity;
  if (availableQuantity < quantity) {
    return NextResponse.json(
      { error: "Not enough stock available" },
      { status: 409 }
    );
  }

  const reservation = await db.$transaction(async (tx) => {
    await tx.inventory.update({
      where: { id: inventory.id },
      data: { reservedQuantity: inventory.reservedQuantity + quantity },
    });

    return tx.reservation.create({
      data: {
        productId,
        warehouseId,
        quantity,
        status: "CONFIRMED",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  });

  return NextResponse.json(reservation, { status: 201 });
}
