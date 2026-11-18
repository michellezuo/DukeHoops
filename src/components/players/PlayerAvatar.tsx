import Image from "next/image";
import { cn } from "@/components/ui/primitives";

/** Headshot when the source provides one; initials otherwise (never a stock photo). */
export function PlayerAvatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  if (src) {
    return (
      <Image
        src={src}
        alt={`${name} headshot`}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full bg-surface-2 object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-brand text-on-brand font-semibold", className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}
