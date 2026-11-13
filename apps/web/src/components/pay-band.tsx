import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface BandStats {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

interface PayBandProps {
  stats: BandStats;
  currency: string;
  /** Shared axis so bands in the same table are comparable. Defaults to the band's own range. */
  domain?: { min: number; max: number };
  /** Highlights where one salary sits within the band, e.g. an individual employee. */
  marker?: number;
  className?: string;
}

/**
 * A compact range strip: whiskers from min to max, a brass bar for the middle 50% of earners
 * (P25 to P75) and a tick at the median. Answers "what is normal pay here?" at a glance.
 */
export function PayBand({ stats, currency, domain, marker, className }: PayBandProps) {
  const lower = domain?.min ?? Math.min(stats.min, marker ?? stats.min);
  const upper = domain?.max ?? Math.max(stats.max, marker ?? stats.max);
  const position = (value: number) =>
    upper === lower ? 50 : ((value - lower) / (upper - lower)) * 100;

  const money = (value: number) => formatMoney(value, currency);
  const label =
    `Range ${money(stats.min)} to ${money(stats.max)}, middle half ${money(stats.p25)} to ` +
    `${money(stats.p75)}, median ${money(stats.median)}` +
    (marker === undefined ? '' : `, this employee ${money(marker)}`);

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className={cn('relative h-5 w-full', className)}
    >
      <span
        className="bg-muted-foreground/35 absolute top-1/2 h-px -translate-y-1/2"
        style={{
          left: `${position(stats.min)}%`,
          width: `${position(stats.max) - position(stats.min)}%`,
        }}
      />
      <span
        className="bg-brass absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[2px]"
        style={{
          left: `${position(stats.p25)}%`,
          width: `max(2px, ${position(stats.p75) - position(stats.p25)}%)`,
        }}
      />
      <span
        className="bg-petrol absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${position(stats.median)}%` }}
      />
      {marker !== undefined && (
        <span
          data-testid="pay-band-marker"
          className="border-petrol absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white"
          style={{ left: `${position(marker)}%` }}
        />
      )}
    </div>
  );
}
