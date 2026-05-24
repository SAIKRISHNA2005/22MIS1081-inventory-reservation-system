import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createReservation } from "@/lib/reservation-service";
import { InsufficientStockError } from "@/lib/errors";
import { CreateReservationSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = CreateReservationSchema.parse(body);
    const reservation = await createReservation(input);
    return NextResponse.json(reservation, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
