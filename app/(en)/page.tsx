import LandingPage from '@/components/LandingPage';
import { ROUTE_MAP } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata(ROUTE_MAP['']);

export default function Home() {
  return <LandingPage route={ROUTE_MAP['']} />;
}
