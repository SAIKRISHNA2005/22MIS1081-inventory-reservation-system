import * as React from "react";

import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  animated?: boolean;
};

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, animated = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-2xl bg-muted",
        animated && "animate-pulse",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
