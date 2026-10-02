import '../globals.css';
import type { Metadata, Viewport } from 'next';
import SiteShell from '@/components/SiteShell';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  applicationName: SITE_CONFIG.name,
  verification: SITE_CONFIG.googleSiteVerification ? { google: SITE_CONFIG.googleSiteVerification } : undefined
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f172a' };

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell locale="en">{children}</SiteShell>;
}
