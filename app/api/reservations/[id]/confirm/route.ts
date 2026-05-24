import { NextRequest, NextResponse } from "next/server";
import { confirmReservation } from "@/lib/reservation-service";
import {
  ReservationNotFoundError,
  ReservationAlreadyProcessedError,
  ReservationExpiredError,
} from "@/lib/errors";
import {
  getIdempotencyResult,
  saveIdempotencyResult,
} from "@/lib/idempotency-service";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  const idempotencyKey = req.headers.get("idempotency-key");

  if (idempotencyKey) {
    const cached = await getIdempotencyResult(idempotencyKey);
    if (cached) {
      return NextResponse.json(cached.body, { status: cached.status });
    }
  }

  try {
    const reservation = await confirmReservation(params.id);

    if (idempotencyKey) {
      await saveIdempotencyResult(idempotencyKey, 200, reservation);
    }

    return NextResponse.json(reservation);
  } catch (err) {
    if (err instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof ReservationAlreadyProcessedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof ReservationExpiredError) {
      return NextResponse.json({ error: err.message }, { status: 410 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
