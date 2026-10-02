import React from 'react';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { SITE_CONFIG, Locale } from '@/lib/config';

const NAV: Record<Locale, Array<{ href: string; label: string }>> = {
  en: [
    { href: '/ai-image-detector', label: 'Image' },
    { href: '/ai-text-detector', label: 'Text' },
    { href: '/content-credentials-checker', label: 'C2PA' },
    { href: '/deepfake-detector', label: 'Deepfake' }
  ],
  fr: [
    { href: '/fr/detecteur-image-ia', label: 'Image' },
    { href: '/fr/detecteur-ia-texte', label: 'Texte' },
    { href: '/fr/verificateur-content-credentials', label: 'C2PA' },
    { href: '/fr/detecteur-deepfake', label: 'Deepfake' }
  ]
};

export default function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const isFr = locale === 'fr';
  return (
    <html lang={locale}>
      <body>
        <a className="skip" href="#main">{isFr ? 'Aller au contenu' : 'Skip to content'}</a>
        <header className="header-wrap">
          <div className="header">
            <Link href={isFr ? '/fr' : '/'} className="logo">
              {SITE_CONFIG.name}
            </Link>
            <nav className="nav" aria-label={isFr ? 'Navigation principale' : 'Main navigation'}>
              {NAV[locale].map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main id="main" className="container">{children}</main>
        <footer className="footer">
          <nav className="footer-nav">
            <Link href={isFr ? '/fr/detecteur-ia' : '/ai-detector'}>{isFr ? 'Détecteur IA' : 'AI Detector'}</Link>
            <Link href={isFr ? '/fr/detecteur-video-ia' : '/ai-video-detector'}>{isFr ? 'Vidéo IA (bêta)' : 'AI Video (beta)'}</Link>
            <Link href={isFr ? '/fr/confidentialite' : '/privacy'}>{isFr ? 'Confidentialité' : 'Privacy'}</Link>
            <Link href={isFr ? '/fr/mentions-legales' : '/terms'}>{isFr ? 'Mentions légales' : 'Terms'}</Link>
            <a href={`mailto:${SITE_CONFIG.contactEmail}`}>Contact</a>
          </nav>
          <p>
            © {new Date().getFullYear()} {SITE_CONFIG.legalName}.{' '}
            {isFr ? 'Résultats probabilistes — jamais une preuve.' : 'Probabilistic results — never proof.'}
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
