import badge from "@/assets/rootify-badge.png";
import { cn } from "@/lib/utils";

export const TAGLINE = "Rewrite the Road. Fix the Journey.";

export function Badge({ size, className }: { size: number; className?: string }) {
  return (
    <img
      src={badge}
      alt="Rootify"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}
