"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type BlurToastProps = {
  open: boolean;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  duration?: number;
};

export function BlurToast({
  open,
  title,
  description,
  icon,
  onClose,
  duration = 2500,
}: BlurToastProps) {
  useEffect(() => {
    if (!open || !onClose) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [open, onClose, duration]);

  useEffect(() => {
    if (!open) return;

    const { overflow, position, top, width } = document.body.style;
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-hidden p-4"
      role="alertdialog"
      aria-live="assertive"
      aria-label={title}
    >
      <div className="fixed inset-0 h-[100dvh] min-h-screen min-h-[100dvh] w-full bg-slate-900/35 backdrop-blur-md toast-backdrop-in" />
      <div
        className={cn(
          "relative w-full max-w-sm rounded-xl border border-white/60 bg-white/95 px-6 py-5 text-center shadow-xl",
          "backdrop-blur-xl toast-card-in",
        )}
      >
        {icon && <div className="mb-3 flex justify-center">{icon}</div>}
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {description && <p className="mt-1.5 text-sm text-slate-600">{description}</p>}
      </div>
    </div>
  );
}
