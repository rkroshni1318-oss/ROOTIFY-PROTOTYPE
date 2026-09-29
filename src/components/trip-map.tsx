import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, type ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const Inner = lazy(() => import("./trip-map.client"));

export function TripMap(props: ComponentProps<typeof Inner> & { className?: string }) {
  const fallback = <Skeleton className="h-full w-full" aria-label="Loading map" />;
  return (
    <div className={props.className ?? "h-80 overflow-hidden rounded-xl border"}>
      <ClientOnly fallback={fallback}>
        <Suspense fallback={fallback}>
          <Inner {...props} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
