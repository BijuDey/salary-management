import type { Metadata } from 'next';
import { PayInsights } from '@/features/insights/pay-insights';

export const metadata: Metadata = { title: 'Pay insights' };

export default function InsightsPage() {
  return <PayInsights />;
}
