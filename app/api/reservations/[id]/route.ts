import { NextResponse } from "next/server";

import { getReservation } from "@/lib/reservation-service";
import { handleApiError } from "@/lib/api-response";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const reservation = await getReservation(params.id);
    return NextResponse.json(reservation);
  } catch (err) {
    return handleApiError(err);
  }
}
