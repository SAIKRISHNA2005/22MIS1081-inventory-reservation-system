import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  InsufficientStockError,
  ReservationNotFoundError,
  ReservationExpiredError,
  ReservationAlreadyProcessedError,
} from "./errors";

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
  if (err instanceof ReservationNotFoundError)
    return NextResponse.json({ error: err.message }, { status: 404 });
  if (err instanceof ReservationExpiredError)
    return NextResponse.json({ error: err.message }, { status: 410 });
  if (err instanceof InsufficientStockError || err instanceof ReservationAlreadyProcessedError)
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  if (err && typeof err === "object" && "code" in err) {
    const prismaErr = err as { code?: string; message?: string };
    console.error("[api error] prisma", prismaErr.code, prismaErr.message);
  } else {
    console.error("[api error]", err);
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
