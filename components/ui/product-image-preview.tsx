"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Images, MousePointerClick, X } from "lucide-react";
import { ImageSwiper } from "@/components/ui/image-swiper";

type ProductImagePreviewProps = {
  images: string[];
  productName: string;
  sku: string;
};

export function ProductImagePreview({ images, productName, sku }: ProductImagePreviewProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const primaryImage = images[0];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!primaryImage) return null;

  const overlay =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label={`${productName} photos`}
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-xl preview-overlay-in" />

            <div
              className="relative z-10 flex flex-col items-center px-6 preview-swiper-in"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close gallery"
                className="absolute -right-2 -top-10 rounded-full bg-white/15 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>

              <p className="mb-5 text-center text-sm font-medium text-white drop-shadow-sm">
                {productName}
              </p>
              <ImageSwiper images={images} cardWidth={360} cardHeight={340} />
              {images.length > 1 ? (
                <p className="mt-5 text-sm text-white/90">Swipe to browse · click outside to close</p>
              ) : (
                <p className="mt-5 text-sm text-white/90">Click outside to close</p>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="border-b border-slate-100 bg-slate-50">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative mx-auto flex h-52 w-full cursor-pointer items-center justify-center px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          aria-label={`View photos of ${productName}`}
        >
          <div className="relative h-full w-full max-w-[220px] overflow-hidden rounded-md border border-slate-200 bg-white transition-transform duration-200 group-hover:scale-[1.02] group-active:scale-[0.98]">
            <Image
              src={primaryImage}
              alt={productName}
              fill
              sizes="220px"
              className="object-contain p-2"
              priority
            />
          </div>

          {images.length > 1 && (
            <span className="pointer-events-none absolute bottom-3 right-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur-sm">
              <Images className="h-3 w-3" />
              {images.length} photos
            </span>
          )}
        </button>

        <div className="mx-4 mb-3 flex items-center gap-2 rounded-md border border-slate-200/80 bg-white px-2.5 py-2 text-xs text-slate-600 shadow-sm">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>Click image to view product photos</span>
        </div>

        <p className="border-t border-slate-100 py-2 text-center font-mono text-xs text-slate-500">
          {sku}
        </p>
      </div>

      {overlay}
    </>
  );
}
