import { NextResponse } from "next/server";
import { releaseReservation } from "@/lib/reservation-service";
import { ReservationNotFoundError } from "@/lib/errors";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const reservation = await releaseReservation(params.id);
    return NextResponse.json(reservation);
  } catch (err) {
    if (err instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
