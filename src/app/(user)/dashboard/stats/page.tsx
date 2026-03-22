import { redirect } from 'next/navigation';

/**
 * The /dashboard/stats route has been merged into the main dashboard.
 * Analytics are now in the Analytics tab at /dashboard?tab=analytics
 */
export default function StatsPage() {
  redirect('/dashboard?tab=analytics');
}
