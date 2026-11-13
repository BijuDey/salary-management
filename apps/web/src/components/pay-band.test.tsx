import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PayBand } from './pay-band';

const stats = { min: 40_000, p25: 50_000, median: 60_000, p75: 70_000, max: 100_000 };

describe('PayBand', () => {
  it('describes the band in words for screen readers', () => {
    render(<PayBand stats={stats} currency="USD" />);

    expect(
      screen.getByRole('img', {
        name: 'Range $40,000 to $100,000, middle half $50,000 to $70,000, median $60,000',
      }),
    ).toBeInTheDocument();
  });

  it('places an employee marker relative to the band', () => {
    render(<PayBand stats={stats} currency="USD" marker={70_000} />);

    // 70k on a 40k–100k axis sits exactly halfway.
    expect(screen.getByTestId('pay-band-marker')).toHaveStyle({ left: '50%' });
    expect(screen.getByRole('img')).toHaveAccessibleName(/this employee \$70,000/);
  });

  it('extends the axis when the marker falls outside the band', () => {
    render(<PayBand stats={stats} currency="USD" marker={120_000} />);
    expect(screen.getByTestId('pay-band-marker')).toHaveStyle({ left: '100%' });
  });
});
