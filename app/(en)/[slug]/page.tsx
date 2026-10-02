import { notFound } from 'next/navigation';
import LandingPage from '@/components/LandingPage';
import { getRoute, slugsFor } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';

const LOCALE = 'en' as const;
type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return slugsFor(LOCALE).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const route = getRoute(LOCALE, (await params).slug);
  return route ? buildMetadata(route) : {};
}

export default async function Page({ params }: Props) {
  const route = getRoute(LOCALE, (await params).slug);
  if (!route) notFound();
  return <LandingPage route={route} />;
}
