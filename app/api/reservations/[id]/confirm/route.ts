import { NextRequest, NextResponse } from "next/server";

import { confirmReservation } from "@/lib/reservation-service";
import { handleApiError } from "@/lib/api-response";
import {
  getIdempotencyResult,
  saveIdempotencyResult,
} from "@/lib/idempotency-service";

interface Params {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

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
    return handleApiError(err);
  }
}
