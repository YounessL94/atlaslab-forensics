// Accepts either the bare token or the full <meta name="google-site-verification" content="..."> tag.
function parseVerification(raw?: string): string {
  const v = (raw || '').trim();
  const m = v.match(/content=["']([^"']+)["']/i);
  return m ? m[1] : v;
}

export const SITE_CONFIG = {
  // Canonical origin. Switch NEXT_PUBLIC_SITE_URL to the custom domain only once it serves this site.
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://atlaslab-forensics.vercel.app').replace(/\/$/, ''),
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Atlas Forensics',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@atlaslab.io',
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || 'Atlas Lab Inc.',
  googleSiteVerification: parseVerification(process.env.GOOGLE_SITE_VERIFICATION),
  affiliateTextUrl: process.env.NEXT_PUBLIC_AFFILIATE_TEXT_URL || '',
  affiliateImageUrl: process.env.NEXT_PUBLIC_AFFILIATE_IMAGE_URL || '',
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '',
  adsenseSlotResult: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULT || '',
  adsenseSlotContent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT || ''
};

export const THRESHOLDS = {
  AI_LIKELY_HIGH: 80,
  AI_LIKELY_MED: 65,
  INDETERMINATE_LOW: 35,
  TEXT_MIN_CHARS: 300,
  TEXT_MAX_CHARS: 20000,
  IMAGE_MAX_BYTES: 4 * 1024 * 1024
};

export type Locale = 'en' | 'fr';
