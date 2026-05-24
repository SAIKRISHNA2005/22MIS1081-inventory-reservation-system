import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createReservation } from "@/lib/reservation-service";
import { InsufficientStockError } from "@/lib/errors";
import { CreateReservationSchema } from "@/lib/schemas";
import {
  getIdempotencyResult,
  saveIdempotencyResult,
} from "@/lib/idempotency-service";

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("idempotency-key");

  if (idempotencyKey) {
    const cached = await getIdempotencyResult(idempotencyKey);
    if (cached) {
      return NextResponse.json(cached.body, { status: cached.status });
    }
  }

  try {
    const body = await req.json();
    const input = CreateReservationSchema.parse(body);
    const reservation = await createReservation(input);

    if (idempotencyKey) {
      await saveIdempotencyResult(idempotencyKey, 201, reservation);
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof InsufficientStockError) {
      const errorBody = { error: err.message };

      if (idempotencyKey) {
        await saveIdempotencyResult(idempotencyKey, 409, errorBody);
      }

      return NextResponse.json(errorBody, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
