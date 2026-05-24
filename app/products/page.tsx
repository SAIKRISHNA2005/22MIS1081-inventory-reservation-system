"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImagePreview } from "@/components/ui/product-image-preview";
import { formatPrice, resolveProductDisplay } from "@/lib/product-display";

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
  price?: number | null;
  description?: string | null;
  images?: string | null;
  warehouses: InventoryEntry[];
};

function firstAvailableWarehouse(warehouses: InventoryEntry[]) {
  return warehouses.find((w) => w.availableQuantity > 0) ?? warehouses[0];
}

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const display = resolveProductDisplay(product);

  const defaultWarehouse = firstAvailableWarehouse(product.warehouses);
  const [warehouseId, setWarehouseId] = useState(defaultWarehouse?.warehouseId ?? "");
  const selected =
    product.warehouses.find((w) => w.warehouseId === warehouseId) ?? defaultWarehouse;
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selected?.warehouseId) {
        throw new Error("Select a warehouse with available stock");
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          productId: product.id,
          warehouseId: selected.warehouseId,
          quantity,
        }),
      });

      if (!response.ok) {
        let message = "Could not complete reservation";
        try {
          const body = await response.json();
          if (typeof body.error === "string") {
            message = body.error;
          } else if (response.status === 409) {
            message = "Not enough stock at this warehouse";
          }
        } catch {
        }
        throw new Error(message);
      }

      return response.json();
    },
    onMutate: () => {
      setError(null);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push(`/reservation/${data.id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not complete reservation");
    },
  });

  const maxQty = selected?.availableQuantity ?? 0;
  const canReserve = maxQty > 0 && quantity >= 1 && quantity <= maxQty;

  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {display.images.length > 0 && (
        <ProductImagePreview
          images={display.images}
          productName={product.name}
          sku={product.sku}
        />
      )}

      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-[15px] font-semibold leading-snug text-slate-900">{product.name}</h2>
        {display.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {display.description}
          </p>
        )}

        {display.price > 0 && (
          <p className="mt-3 text-lg font-semibold tabular-nums text-slate-900">
            {formatPrice(display.price)}
            <span className="ml-1 text-xs font-normal text-slate-500">per unit</span>
          </p>
        )}

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            Warehouse
          </p>
          <div className="space-y-1">
            {product.warehouses.map((warehouse) => {
              const isSelected = selected?.warehouseId === warehouse.warehouseId;
              const outOfStock = warehouse.availableQuantity === 0;

              return (
                <button
                  key={warehouse.warehouseId}
                  type="button"
                  onClick={() => {
                    setWarehouseId(warehouse.warehouseId);
                    setQuantity(1);
                  }}
                  disabled={outOfStock}
                  className={`btn-interactive flex w-full items-center justify-between rounded border px-2.5 py-1.5 text-left text-sm ${
                    isSelected
                      ? "border-slate-800 bg-slate-800 text-white hover:bg-slate-700"
                      : outOfStock
                        ? "cursor-not-allowed border-slate-100 text-slate-400"
                        : "border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <span className={isSelected ? "text-white" : ""}>{warehouse.warehouseName}</span>
                  <span
                    className={`text-xs ${
                      outOfStock
                        ? "text-red-600"
                        : isSelected
                          ? "text-slate-200"
                          : "text-slate-600"
                    }`}
                  >
                    {outOfStock ? "None left" : `${warehouse.availableQuantity} avail.`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {maxQty > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              Qty
            </p>
            <div className="inline-flex items-center overflow-hidden rounded border border-slate-200">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="btn-interactive px-2.5 py-1 text-slate-800 hover:bg-slate-100 disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-[2rem] border-x border-slate-200 px-2 py-1 text-center text-sm tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                className="btn-interactive px-2.5 py-1 text-slate-800 hover:bg-slate-100 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (canReserve) mutation.mutate();
          }}
          disabled={!canReserve || mutation.isPending}
          className="btn-interactive mt-4 h-9 w-full bg-slate-900 text-white hover:bg-slate-700 hover:text-white disabled:bg-slate-300 disabled:text-slate-500"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reserving…
            </>
          ) : (
            "Reserve"
          )}
        </Button>

        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}

export default function ProductsPage() {
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 h-7 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[480px] animate-pulse rounded-md bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <p className="text-red-600">Could not load products. Refresh to try again.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose a warehouse and quantity. Reservations hold stock for 10 minutes.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
