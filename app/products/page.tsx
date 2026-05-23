"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type InventoryEntry = {
  warehouseId: string;
  warehouseName: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  warehouses: InventoryEntry[];
};

export default function ProductsPage() {
  const router = useRouter();
  const [activeReserve, setActiveReserve] = useState<{
    productId: string;
    warehouseId: string;
  } | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reserveErrors, setReserveErrors] = useState<Record<string, string>>({});

  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to load products");
      }
      return response.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async ({
      productId,
      warehouseId,
      quantity,
    }: {
      productId: string;
      warehouseId: string;
      quantity: number;
    }) => {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, warehouseId, quantity }),
      });

      if (response.status === 409) {
        throw new Error("NOT_ENOUGH_STOCK");
      }

      if (!response.ok) {
        throw new Error("REQUEST_FAILED");
      }

      return response.json();
    },
    onSuccess: (data) => {
      router.push(`/reservation/${data.id}`);
    },
    onError: (error, variables) => {
      if (!variables) return;
      const key = `${variables.productId}-${variables.warehouseId}`;
      if (error instanceof Error && error.message === "NOT_ENOUGH_STOCK") {
        setReserveErrors((prev) => ({
          ...prev,
          [key]: "Not enough stock available",
        }));
      } else {
        setReserveErrors((prev) => ({
          ...prev,
          [key]: "Unable to reserve at this time",
        }));
      }
    },
  });

  const handleReserveClick = (
    productId: string,
    warehouseId: string,
    maxQuantity: number
  ) => {
    const key = `${productId}-${warehouseId}`;
    setActiveReserve({ productId, warehouseId });
    setQuantities((prev) => ({
      ...prev,
      [key]: Math.max(1, Math.min(prev[key] ?? 1, maxQuantity)),
    }));
    setReserveErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleQuantityChange = (
    productId: string,
    warehouseId: string,
    value: string,
    maxQuantity: number
  ) => {
    const key = `${productId}-${warehouseId}`;
    const numeric = Number(value);
    setQuantities((prev) => ({
      ...prev,
      [key]: Math.min(Math.max(Number.isNaN(numeric) ? 1 : numeric, 1), maxQuantity),
    }));
  };

  const handleConfirm = async (productId: string, warehouseId: string) => {
    const key = `${productId}-${warehouseId}`;
    const quantity = quantities[key] ?? 1;
    setReserveErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      await mutation.mutateAsync({ productId, warehouseId, quantity });
    } catch {
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="space-y-4 p-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <div className="space-y-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-destructive">Unable to load products. Please try again later.</div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {(products ?? []).length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No products available.</Card>
      ) : (
        products.map((product) => (
          <Card key={product.id} className="p-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>

            <div className="mt-6 space-y-4">
              {product.warehouses.map((warehouse) => {
                const key = `${product.id}-${warehouse.warehouseId}`;
                const isActive =
                  activeReserve?.productId === product.id &&
                  activeReserve?.warehouseId === warehouse.warehouseId;
                const currentQuantity = quantities[key] ?? 1;
                const isLoadingButton =
                  mutation.isLoading &&
                  activeReserve?.productId === product.id &&
                  activeReserve?.warehouseId === warehouse.warehouseId;

                return (
                  <div key={warehouse.warehouseId} className="rounded-3xl border border-border bg-background p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{warehouse.warehouseName}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={warehouse.availableQuantity > 0 ? "success" : "destructive"}
                        >
                          {warehouse.availableQuantity}
                        </Badge>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={warehouse.availableQuantity === 0}
                          onClick={() =>
                            handleReserveClick(
                              product.id,
                              warehouse.warehouseId,
                              warehouse.availableQuantity
                            )
                          }
                        >
                          Reserve
                        </Button>
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-4 rounded-2xl border border-border bg-muted p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <label className="flex w-full flex-col gap-2">
                            <span className="text-sm font-medium">Quantity</span>
                            <input
                              type="number"
                              min={1}
                              max={warehouse.availableQuantity}
                              value={currentQuantity}
                              onChange={(event) =>
                                handleQuantityChange(
                                  product.id,
                                  warehouse.warehouseId,
                                  event.target.value,
                                  warehouse.availableQuantity
                                )
                              }
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </label>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={warehouse.availableQuantity === 0 || mutation.isLoading}
                            onClick={() => handleConfirm(product.id, warehouse.warehouseId)}
                          >
                            {isLoadingButton ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                                Confirm Reserve
                              </span>
                            ) : (
                              "Confirm Reserve"
                            )}
                          </Button>
                        </div>

                        {reserveErrors[key] ? (
                          <p className="mt-3 text-sm text-destructive">
                            {reserveErrors[key]}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
