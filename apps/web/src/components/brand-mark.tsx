/** A stack of three bars rising like a pay band: the product's only ornament. */
export function BrandMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <rect width="28" height="28" rx="6" fill="#17504f" />
      <rect x="6" y="15" width="4" height="7" rx="1" fill="#9fbab6" />
      <rect x="12" y="10" width="4" height="12" rx="1" fill="#d7e3e1" />
      <rect x="18" y="6" width="4" height="16" rx="1" fill="#b07a1f" />
    </svg>
  );
}
