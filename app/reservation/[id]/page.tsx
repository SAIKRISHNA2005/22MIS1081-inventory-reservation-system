"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BlurToast } from "@/components/ui/blur-toast";
import { ReservationTimer } from "@/components/ui/reservation-timer";
import { formatPrice } from "@/lib/product-display";

interface Props {
  params: { id: string };
}

interface ReservationError extends Error {
  status?: number;
}

interface Reservation {
  id: string;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    price?: number | null;
  };
  warehouse: {
    id: string;
    name: string;
    location?: string;
  };
}

export default function ReservationPage({ params }: Props) {
  const { id } = params;
  const router = useRouter();
  const qc = useQueryClient();
  const [localError, setLocalError] = useState<string | null>(null);
  const [showCancelToast, setShowCancelToast] = useState(false);

  const {
    data: reservation,
    error: queryError,
    isLoading,
  } = useQuery<Reservation>({
    queryKey: ["reservation", id],
    queryFn: async () => {
      const res = await fetch(`/api/reservations/${id}`);
      if (res.status === 410) {
        const error: ReservationError = new Error("Reservation expired");
        error.status = 410;
        throw error;
      }
      if (!res.ok) {
        const error: ReservationError = new Error("Failed to load reservation");
        error.status = res.status;
        throw error;
      }
      return res.json();
    },
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 5000 : false),
  });

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!reservation?.expiresAt) return;
    setTimeLeft(Math.max(0, new Date(reservation.expiresAt).getTime() - Date.now()));
  }, [reservation?.expiresAt]);

  useEffect(() => {
    if (!reservation || reservation.status !== "PENDING") return;

    const update = () => {
      const left = Math.max(0, new Date(reservation.expiresAt).getTime() - Date.now());
      setTimeLeft(left);
      if (left <= 0) qc.invalidateQueries({ queryKey: ["reservation", id] });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [reservation, id, qc]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      setLocalError(null);
      const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST" });
      if (!res.ok) {
        const error: ReservationError = new Error("Failed to confirm");
        error.status = res.status;
        throw error;
      }
      return res.json();
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["reservation", id] });
    },
    onError(err: unknown) {
      const error = err as ReservationError;
      if (error?.status === 410) {
        setLocalError("Your reservation has expired.");
      } else {
        setLocalError("Failed to confirm reservation.");
      }
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      setLocalError(null);
      const res = await fetch(`/api/reservations/${id}/release`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to cancel");
      return res.json();
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["reservation", id] });
      setShowCancelToast(true);
    },
    onError() {
      setLocalError("Failed to cancel reservation.");
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <Skeleton className="mb-6 h-8 w-2/3" />
        <Skeleton className="mb-4 h-40" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (queryError && (queryError as ReservationError).status === 410) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center sm:px-6">
        <XCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
        <h1 className="text-lg font-semibold text-slate-900">Reservation expired</h1>
        <p className="mt-2 text-sm text-slate-600">
          The hold on this stock has been released.
        </p>
        <Button onClick={() => router.push("/products")} className="mt-6">
          Back to inventory
        </Button>
      </div>
    );
  }

  if (queryError || !reservation) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center sm:px-6">
        <p className="text-sm text-red-600">Could not load this reservation.</p>
        <Button onClick={() => router.push("/products")} className="mt-4">
          Back to inventory
        </Button>
      </div>
    );
  }

  const isPending = reservation.status === "PENDING";
  const isConfirmed = reservation.status === "CONFIRMED";
  const isReleased = reservation.status === "RELEASED";
  const expired = isPending && timeLeft <= 0;
  const price = reservation.product?.price ?? 0;

  return (
    <>
      <BlurToast
        open={showCancelToast}
        title="Reservation cancelled"
        description="Stock has been returned to the warehouse."
        icon={<XCircle className="h-10 w-10 text-red-500" />}
        onClose={() => {
          setShowCancelToast(false);
          router.push("/products");
        }}
        duration={2400}
      />

      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={() => router.push("/products")}
        className="btn-interactive mb-6 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Inventory
      </button>

      <h1 className="text-xl font-semibold text-slate-900">
        {isPending && !expired
          ? "Confirm reservation"
          : isConfirmed
            ? "Order confirmed"
            : isReleased
              ? "Reservation cancelled"
              : "Reservation expired"}
      </h1>

      <div className="mt-6 space-y-4">
        {isReleased && (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="text-red-800">Units returned to available stock.</p>
          </div>
        )}

        {isConfirmed && (
          <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-emerald-800">Inventory updated. This order is confirmed.</p>
          </div>
        )}

        {isPending && (
          <ReservationTimer timeLeftMs={expired ? 0 : timeLeft} />
        )}

        <div className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-medium text-slate-900">Order summary</h2>
          </div>

          <div className="space-y-4 px-4 py-4 text-sm">
            <div>
              <p className="font-medium text-slate-900">{reservation.product.name}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-500">{reservation.product.sku}</p>
              {price > 0 && (
                <p className="mt-2 text-base font-semibold tabular-nums text-slate-900">
                  {formatPrice(price)}
                </p>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Warehouse</dt>
                <dd className="mt-1 font-medium text-slate-900">{reservation.warehouse.name}</dd>
                {reservation.warehouse.location && (
                  <dd className="text-slate-600">{reservation.warehouse.location}</dd>
                )}
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Quantity</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                  {reservation.quantity}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {localError && (
          <p className="text-sm text-red-600" role="alert">
            {localError}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {isPending && !expired ? (
            <>
              <Button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending || releaseMutation.isPending}
                className="btn-interactive h-10 w-full bg-emerald-700 text-white hover:bg-emerald-600 hover:text-white disabled:bg-emerald-300 disabled:text-emerald-50"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming…
                  </>
                ) : (
                  "Confirm purchase"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => releaseMutation.mutate()}
                disabled={confirmMutation.isPending || releaseMutation.isPending}
                className="btn-interactive h-10 w-full border-slate-300 bg-white text-slate-800 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
              >
                {releaseMutation.isPending ? "Cancelling…" : "Cancel reservation"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push("/products")}
              className="btn-interactive h-10 w-full bg-slate-900 text-white hover:bg-slate-700 hover:text-white"
            >
              Back to inventory
            </Button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
