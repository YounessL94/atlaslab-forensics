'use client';

import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    __tsLoading?: Promise<void>;
  }
}

export interface TurnstileHandle {
  reset: () => void;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!window.__tsLoading) {
    window.__tsLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        window.__tsLoading = undefined;
        reject(new Error('turnstile load failed'));
      };
      document.head.appendChild(s);
    });
  }
  return window.__tsLoading;
}

/** Cloudflare Turnstile widget. Without a site key (local dev only) it emits a placeholder token. */
const Turnstile = forwardRef<TurnstileHandle, { onToken: (t: string | null) => void; locale: 'en' | 'fr' }>(function Turnstile(
  { onToken, locale },
  ref
) {
  const el = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useImperativeHandle(ref, () => ({
    reset() {
      cb.current(SITE_KEY ? null : 'dev');
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    }
  }));

  useEffect(() => {
    if (!SITE_KEY) {
      cb.current('dev');
      return;
    }
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !el.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(el.current, {
          sitekey: SITE_KEY,
          language: locale,
          action: 'analyze',
          'refresh-expired': 'auto',
          callback: (t: string) => cb.current(t),
          'expired-callback': () => cb.current(null),
          'error-callback': () => cb.current(null)
        });
      })
      .catch(() => cb.current(null));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [locale]);

  return <div ref={el} className="turnstile" />;
});

export default Turnstile;
