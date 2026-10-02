import type { MetadataRoute } from 'next';
import { allRoutes, absUrl, hreflang } from '@/lib/seo';

const LAST_MODIFIED = new Date('2026-10-02');

export default function sitemap(): MetadataRoute.Sitemap {
  return allRoutes().map((route) => {
    const { en, fr } = hreflang(route);
    const isLegal = route.toolType === 'privacy' || route.toolType === 'terms';
    return {
      url: absUrl(route.slug),
      lastModified: LAST_MODIFIED,
      changeFrequency: isLegal ? 'yearly' : 'weekly',
      priority: route.slug === '' ? 1 : isLegal ? 0.2 : route.toolType === 'video' || route.toolType === 'deepfake' ? 0.5 : 0.8,
      alternates: { languages: { en, fr } }
    };
  });
}
