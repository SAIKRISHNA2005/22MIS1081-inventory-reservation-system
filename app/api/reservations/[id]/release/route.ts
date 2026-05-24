import { NextResponse } from "next/server";

import { releaseReservation } from "@/lib/reservation-service";
import { handleApiError } from "@/lib/api-response";

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
    return handleApiError(err);
  }
}
