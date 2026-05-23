import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { releaseReservation } from "@/lib/reservation-service";

export async function GET(req: NextRequest) {
  /*
   * CRON CLEANUP — runs every minute via Vercel Cron.
   * Finds all PENDING reservations past their expiresAt and releases them.
   * This is the "eventual consistency" layer of the hybrid expiry strategy.
   * The "correctness" layer is lazy expiry in getReservation().
   *
   * Together: lazy expiry handles active users in real-time;
   * cron handles abandoned reservations where no further reads occur.
   */
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiredReservations = await db.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    expiredReservations.map((r) => releaseReservation(r.id))
  );

  const released = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[cron] Released ${released} expired reservations, ${failed} failed`);

  return NextResponse.json({
    released,
    failed,
    total: expiredReservations.length,
    timestamp: new Date().toISOString(),
  });
}
