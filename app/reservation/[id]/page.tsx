"use client";

import { useParams } from "next/navigation";

export default function ReservationPage() {
  const params = useParams();
  const reservationId = params?.id ?? "unknown";

  return (
    <div className="p-6">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Reservation created</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Your reservation ID is <span className="font-semibold">{reservationId}</span>.
        </p>
      </div>
    </div>
  );
}
