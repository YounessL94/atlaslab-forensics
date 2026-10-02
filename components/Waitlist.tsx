'use client';

import React, { useState } from 'react';

type WaitlistType = 'pro' | 'api' | 'video' | 'deepfake';

const COPY = {
  en: {
    pro: ['Atlas Forensics Pro & API', 'Batch analysis, higher limits, PDF reports and an API for platforms. Get notified at launch.'],
    api: ['Atlas Forensics API', 'Integrate AI-content forensics into your product.'],
    video: ['AI video detection — private beta', 'Get early access when video analysis opens.'],
    deepfake: ['Deepfake detection — private beta', 'Get early access when deepfake analysis opens.'],
    placeholder: 'you@company.com',
    cta: 'Join the waitlist',
    ok: 'You are on the list. We will email you at launch.',
    err: 'Could not register right now. Please try again.',
    note: 'No spam. Deletion on request.'
  },
  fr: {
    pro: ['Atlas Forensics Pro & API', 'Analyse par lots, limites étendues, rapports PDF et API pour les plateformes. Soyez prévenu au lancement.'],
    api: ['API Atlas Forensics', 'Intégrez la forensique de contenus IA à votre produit.'],
    video: ['Détection vidéo IA — bêta privée', 'Accès anticipé dès l’ouverture de l’analyse vidéo.'],
    deepfake: ['Détection de deepfake — bêta privée', 'Accès anticipé dès l’ouverture de l’analyse deepfake.'],
    placeholder: 'vous@entreprise.fr',
    cta: 'Rejoindre la liste',
    ok: 'Vous êtes inscrit. Nous vous écrirons au lancement.',
    err: 'Inscription impossible pour le moment. Réessayez.',
    note: 'Pas de spam. Suppression sur simple demande.'
  }
};

export default function Waitlist({ locale, type }: { locale: 'en' | 'fr'; type: WaitlistType }) {
  const t = COPY[locale];
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type, locale, company })
      });
      setState(res.ok ? 'ok' : 'err');
    } catch {
      setState('err');
    }
  }

  return (
    <section className="card waitlist" aria-labelledby={`wl-${type}`}>
      <h2 id={`wl-${type}`}>{t[type][0]}</h2>
      <p className="muted">{t[type][1]}</p>
      {state === 'ok' ? (
        <p className="success" role="status">{t.ok}</p>
      ) : (
        <form onSubmit={submit} className="waitlist-form">
          <input
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            aria-label="Email"
            placeholder={t.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            name="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <button className="btn btn-inline" disabled={state === 'sending'}>
            {t.cta}
          </button>
        </form>
      )}
      {state === 'err' && <p className="error" role="alert">{t.err}</p>}
      <p className="small muted">{t.note}</p>
    </section>
  );
}
