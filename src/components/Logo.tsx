//#region Logo — inline SVG component
// Icon only + optional wordmark. Usa `currentColor` para el background → hereda
// el color del contenedor (text-primary = púrpura del theme).
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: number;
  withWordmark?: boolean;
};

export function Logo({ className, size = 32, withWordmark = false }: Props) {
  if (withWordmark) {
    return (
      <svg
        viewBox="0 0 220 64"
        fill="none"
        height={size}
        className={cn("text-primary", className)}
        aria-label="callcito"
      >
        <rect width="64" height="64" rx="14" fill="currentColor" />
        <path
          d="M16 22a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H30l-6 6v-6h-2a6 6 0 0 1-6-6V22Z"
          fill="white"
          fillOpacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M26 26v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 23v14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M38 26v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <text
          x="78"
          y="42"
          fontFamily="Manrope, system-ui, sans-serif"
          fontSize="28"
          fontWeight="700"
          fill="currentColor"
          letterSpacing="-0.5"
        >
          callcito
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      className={cn("text-primary", className)}
      aria-label="callcito"
    >
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <path
        d="M16 22a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H30l-6 6v-6h-2a6 6 0 0 1-6-6V22Z"
        fill="white"
        fillOpacity="0.12"
        stroke="white"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M26 26v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 23v14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 26v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
//#endregion
