import { NextRequest, NextResponse } from "next/server";

import { createReservation } from "@/lib/reservation-service";
import { InsufficientStockError } from "@/lib/errors";
import { CreateReservationSchema } from "@/lib/schemas";
import { handleApiError } from "@/lib/api-response";
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
    if (idempotencyKey && err instanceof InsufficientStockError) {
      await saveIdempotencyResult(idempotencyKey, 409, { error: err.message });
    }
    return handleApiError(err);
  }
}
