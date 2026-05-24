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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="alertdialog"
      aria-live="assertive"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-md toast-backdrop-in" />
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
