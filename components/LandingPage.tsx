import Link from 'next/link';
import Detector from './Detector';
import Waitlist from './Waitlist';
import { RouteContent, pathFor } from '@/lib/content';
import { jsonLd } from '@/lib/seo';

export default function LandingPage({ route }: { route: RouteContent }) {
  const isFr = route.locale === 'fr';
  const isTool = ['image', 'text', 'c2pa', 'hub'].includes(route.toolType);
  const isBeta = route.toolType === 'video' || route.toolType === 'deepfake';
  const isLegal = route.toolType === 'privacy' || route.toolType === 'terms';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(route)).replace(/</g, '\\u003c') }}
      />
      <div className="lang-switch">
        <Link href={pathFor(route.alt)} hrefLang={isFr ? 'en' : 'fr'} lang={isFr ? 'en' : 'fr'}>
          {isFr ? 'English' : 'Français'}
        </Link>
      </div>
      <section className={isLegal ? 'hero hero-left' : 'hero'}>
        <h1>{route.h1}</h1>
        <p>{route.intro}</p>
        {isTool && (
          <div className="trust-strip">
            <span>{isFr ? '✓ Gratuit, sans compte' : '✓ Free, no account'}</span>
            <span>{isFr ? '✓ Contenu non conservé' : '✓ Content not stored'}</span>
            <span>{isFr ? '✓ Incertitude affichée' : '✓ Honest uncertainty'}</span>
          </div>
        )}
      </section>

      {isTool && (
        <Detector
          locale={route.locale}
          initialModality={route.toolType === 'hub' ? 'image' : (route.toolType as 'image' | 'text' | 'c2pa')}
        />
      )}

      {isBeta && <Waitlist locale={route.locale} type={route.toolType as 'video' | 'deepfake'} />}

      <article className="prose">
        {route.sections.map((s) => (
          <section key={s.h2}>
            <h2>{s.h2}</h2>
            {s.p.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}
      </article>

      {route.faq.length > 0 && (
        <section className="faq-section">
          <h2>{isFr ? 'Questions fréquentes' : 'Frequently asked questions'}</h2>
          {route.faq.map((f) => (
            <div key={f.q} className="faq-item">
              <h3 className="faq-q">{f.q}</h3>
              <p className="faq-a">{f.a}</p>
            </div>
          ))}
        </section>
      )}

      {isTool && <Waitlist locale={route.locale} type="pro" />}
    </>
  );
}
