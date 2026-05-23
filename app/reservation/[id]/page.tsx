"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Props {
  params: { id: string };
}

function formatMMSS(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function Page({ params }: Props) {
  const { id } = params;
  const router = useRouter();
  const qc = useQueryClient();

  const [localError, setLocalError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"destructive" | "default">("default");

  const {
    data: reservation,
    error: queryError,
    isLoading,
  } = useQuery({
    queryKey: ["reservation", id],
    queryFn: async () => {
      const res = await fetch(`/api/reservations/${id}`);
      if (res.status === 410) {
        const json = await res.json().catch(() => ({}));
        const e: any = new Error("Expired");
        e.status = 410;
        e.body = json;
        throw e;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const e: any = new Error("Fetch error");
        e.status = res.status;
        e.body = json;
        throw e;
      }
      return res.json();
    },
    refetchInterval: (data: any) => (data?.status === "PENDING" ? 5000 : false),
  });

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    reservation?.expiresAt ? Math.max(0, new Date(reservation.expiresAt).getTime() - Date.now()) : 0
  );

  useEffect(() => {
    if (!reservation) return;
    if (reservation.status !== "PENDING") return;

    const update = () => {
      const left = Math.max(0, new Date(reservation.expiresAt).getTime() - Date.now());
      setTimeLeft(left);
      if (left <= 0) qc.invalidateQueries({ queryKey: ["reservation", id] });
    };

    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [reservation, id, qc]);

  // Mutations
  const confirmMutation = useMutation({
    mutationFn: async () => {
      setLocalError(null);
      setErrorType("default");
      const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST" });
      if (res.status === 409) {
        const e: any = new Error("Conflict");
        e.status = 409;
        throw e;
      }
      if (res.status === 410) {
        const e: any = new Error("Expired");
        e.status = 410;
        throw e;
      }
      if (!res.ok) {
        const e: any = new Error("Confirm failed");
        e.status = res.status;
        throw e;
      }
      return res.json();
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["reservation", id] });
    },
    onError(err: any) {
      if (err?.status === 409) {
        setErrorType("destructive");
        setLocalError("This reservation is no longer active.");
      } else if (err?.status === 410) {
        setErrorType("default");
        setLocalError("Your reservation has expired — the units have been released. Please start a new reservation.");
      } else {
        setErrorType("default");
        setLocalError("An unexpected error occurred while confirming the reservation.");
      }
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      setLocalError(null);
      setErrorType("default");
      const res = await fetch(`/api/reservations/${id}/release`, { method: "POST" });
      if (res.status === 410) {
        const e: any = new Error("Expired");
        e.status = 410;
        throw e;
      }
      if (!res.ok) {
        const e: any = new Error("Release failed");
        e.status = res.status;
        throw e;
      }
      return res.json();
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["reservation", id] });
      router.push("/products");
    },
    onError(err: any) {
      setErrorType("default");
      setLocalError("Failed to cancel reservation. Please try again.");
    },
  });

  // Render
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl p-6">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-6 w-1/4 mb-2" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </Card>
      </div>
    );
  }

  if (queryError && (queryError as any).status === 410) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Reservation expired</h1>
          <p className="mb-4">This reservation expired.</p>
          <Button onClick={() => router.push("/products")}>Browse products</Button>
        </Card>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl p-6">
          <Alert>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to load reservation. Please try again.</AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  // reservation is available
  const isPending = reservation?.status === "PENDING";
  const expired = isPending && timeLeft <= 0;

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">{reservation.product.name}</h1>
        <div className="mb-2 text-sm text-muted-foreground">Warehouse: {reservation.warehouse.name}</div>
        <div className="mb-4">Quantity: {reservation.quantity}</div>

        <div className="mb-4">
          {reservation.status === "PENDING" && <Badge className="bg-amber-400 text-amber-900">PENDING</Badge>}
          {reservation.status === "CONFIRMED" && <Badge className="bg-green-500 text-white">✓ CONFIRMED</Badge>}
          {reservation.status === "RELEASED" && <Badge className="bg-gray-400 text-white">RELEASED</Badge>}
        </div>

        {isPending && !expired && (
          <div className="mb-6">
            <div className="text-5xl font-mono flex items-center gap-3">
              <span className="text-3xl">⏰</span>
              {formatMMSS(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Time left to confirm</div>
          </div>
        )}

        {localError && (
          <div className="mb-4">
            <Alert variant={errorType === "destructive" ? "destructive" : "default"}>
              <AlertTitle>{errorType === "destructive" ? "Cannot confirm" : "Info"}</AlertTitle>
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          </div>
        )}

        {reservation.status === "CONFIRMED" && (
          <div className="mb-4">
            <Alert>
              <AlertTitle>✓ Payment confirmed</AlertTitle>
              <AlertDescription>Payment confirmed. Your order is placed.</AlertDescription>
            </Alert>
          </div>
        )}

        {reservation.status === "RELEASED" && (
          <div className="mb-4">
            <Alert>
              <AlertTitle>Released</AlertTitle>
              <AlertDescription>This reservation has been released.</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex gap-3">
          {isPending && !expired && (
            <>
              <Button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isLoading || releaseMutation.isLoading}
              >
                {confirmMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmMutation.isLoading ? "Processing..." : "Confirm purchase"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => releaseMutation.mutate()}
                disabled={confirmMutation.isLoading || releaseMutation.isLoading}
              >
                {releaseMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {releaseMutation.isLoading ? "Cancelling..." : "Cancel reservation"}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
