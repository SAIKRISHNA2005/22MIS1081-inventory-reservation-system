import { NextResponse } from "next/server";
import { confirmReservation } from "@/lib/reservation-service";
import {
  ReservationNotFoundError,
  ReservationAlreadyProcessedError,
  ReservationExpiredError,
} from "@/lib/errors";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const reservation = await confirmReservation(params.id);
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
