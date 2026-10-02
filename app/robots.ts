import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  // Non-production Vercel deployments (previews) must not be indexed.
  const isProdDeploy = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production';
  return {
    rules: isProdDeploy ? { userAgent: '*', allow: '/', disallow: ['/api/'] } : { userAgent: '*', disallow: '/' },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`
  };
}
