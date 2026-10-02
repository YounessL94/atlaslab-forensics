import type { Metadata } from 'next';
import { ROUTE_MAP, RouteContent, pathFor } from './content';
import { SITE_CONFIG } from './config';

export const absUrl = (key: string) => (key === '' ? `${SITE_CONFIG.url}/` : `${SITE_CONFIG.url}${pathFor(key)}`);

function routeKey(route: RouteContent) {
  return route.slug;
}

export function hreflang(route: RouteContent) {
  const key = routeKey(route);
  const enKey = route.locale === 'en' ? key : route.alt;
  const frKey = route.locale === 'fr' ? key : route.alt;
  return { en: absUrl(enKey), fr: absUrl(frKey), 'x-default': absUrl(enKey) };
}

export function buildMetadata(route: RouteContent): Metadata {
  const url = absUrl(routeKey(route));
  return {
    metadataBase: new URL(SITE_CONFIG.url),
    title: { absolute: route.title },
    description: route.metaDescription,
    alternates: { canonical: url, languages: hreflang(route) },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_CONFIG.name,
      title: route.title,
      description: route.metaDescription,
      locale: route.locale === 'fr' ? 'fr_FR' : 'en_US',
      alternateLocale: route.locale === 'fr' ? 'en_US' : 'fr_FR'
    },
    twitter: { card: 'summary_large_image', title: route.title, description: route.metaDescription },
    robots: { index: true, follow: true }
  };
}

export function jsonLd(route: RouteContent): object[] {
  const url = absUrl(routeKey(route));
  const graph: object[] = [];

  if (route.slug === '' || route.slug === 'fr') {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: absUrl(route.slug),
      inLanguage: route.locale,
      publisher: { '@type': 'Organization', name: SITE_CONFIG.legalName, url: 'https://atlaslab.io', email: SITE_CONFIG.contactEmail }
    });
  }

  if (['image', 'text', 'c2pa', 'hub'].includes(route.toolType)) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: route.h1,
      url,
      description: route.metaDescription,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      inLanguage: route.locale,
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    });
  }

  if (route.faq.length) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: route.locale,
      mainEntity: route.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    });
  }
  return graph;
}

export const allRoutes = () => Object.values(ROUTE_MAP);
