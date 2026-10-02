'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AnalysisResult } from '@/lib/analysis';
import { inspectProvenance, type ProvenanceResult } from '@/lib/c2pa-client';
import Turnstile, { type TurnstileHandle } from './Turnstile';

type Modality = 'image' | 'text' | 'c2pa';

interface Props {
  initialModality?: Modality;
  locale: 'en' | 'fr';
  /** Evaluated at build time on the server (Hive text detection needs an Enterprise key). */
  textAvailable?: boolean;
}

const TEXT_MIN = 250;
const TEXT_MAX = 20000;
const IMAGE_MAX = 4 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const T = {
  en: {
    tabs: { image: 'Image', text: 'Text', c2pa: 'C2PA' },
    textShort: `Text is too short (minimum ${TEXT_MIN} characters).`,
    textLong: 'Text is too long (maximum 20,000 characters).',
    noFile: 'Please select an image file.',
    badType: 'Unsupported format. Use JPG, PNG or WEBP.',
    tooBig: 'This file is larger than the 4 MB limit. For forensic consistency, we do not silently recompress uploads.',
    captcha: 'Please complete the security check first.',
    placeholder: 'Paste text here to analyze (250 to 20,000 characters)...',
    min: 'Min. 250 characters',
    drop: 'Drag & drop an image here or click to browse',
    c2paLocal: 'Checked locally in your browser — not uploaded.',
    analyze: 'Analyze content',
    inspect: 'Inspect Content Credentials',
    analyzing: 'Analyzing signals…',
    failed: 'Analysis service temporarily unavailable.',
    network: 'Network error. Check your connection and try again.',
    estimate: 'AI likelihood estimate',
    verdict: { AI_LIKELY: 'LIKELY AI-GENERATED', INDETERMINATE: 'INDETERMINATE', NO_SUFFICIENT_AI_SIGNAL: 'NO SUFFICIENT AI SIGNAL' },
    reliability: 'Reliability',
    rel: { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' },
    signals: 'Forensic signals',
    why: 'Why this result?',
    limits: 'Important limitations',
    provenance: 'Provenance (C2PA Content Credentials)',
    prov: {
      FOUND: 'Content Credentials found',
      NOT_FOUND: 'No Content Credentials found',
      ERROR: 'Content Credentials could not be read'
    },
    provNotFound: 'Absence of Content Credentials is common (platforms strip metadata) and is not evidence that the content is human-made.',
    provError: 'This file could not be parsed for C2PA. This says nothing about its origin.',
    provAi: 'The manifest declares AI generation (digital source type).',
    provNoAi: 'The manifest does not declare AI generation.',
    state: 'Validation',
    issuer: 'Signed by',
    generator: 'Created with',
    signedAt: 'Signed at',
    stateHelp: { Valid: 'signature and hashes intact', Trusted: 'signed by a trusted certificate', Invalid: 'file modified after signing or invalid signature' },
    ref: 'Reference',
    textOff: 'The AI text detector is not available yet. The image detector and the C2PA checker work now.'
  },
  fr: {
    tabs: { image: 'Image', text: 'Texte', c2pa: 'C2PA' },
    textShort: `Le texte est trop court (minimum ${TEXT_MIN} caractères).`,
    textLong: 'Le texte est trop long (maximum 20 000 caractères).',
    noFile: 'Veuillez sélectionner un fichier image.',
    badType: 'Format non pris en charge. Utilisez JPG, PNG ou WEBP.',
    tooBig: 'Ce fichier dépasse la limite d’analyse de 4 Mo. Pour préserver la cohérence, nous ne recompressons pas les fichiers.',
    captcha: 'Veuillez d’abord valider le contrôle de sécurité.',
    placeholder: 'Collez ici votre texte à analyser (250 à 20 000 caractères)...',
    min: 'Min. 250 caractères',
    drop: 'Glissez-déposez une image ici ou cliquez pour parcourir',
    c2paLocal: 'Vérifié localement dans votre navigateur — aucun envoi.',
    analyze: 'Lancer l’analyse',
    inspect: 'Inspecter les Content Credentials',
    analyzing: 'Analyse en cours…',
    failed: 'Service d’analyse temporairement indisponible.',
    network: 'Erreur réseau. Vérifiez votre connexion et réessayez.',
    estimate: 'Estimation du signal IA',
    verdict: { AI_LIKELY: 'PROBABLEMENT GÉNÉRÉ PAR IA', INDETERMINATE: 'INDÉTERMINÉ', NO_SUFFICIENT_AI_SIGNAL: 'AUCUN SIGNAL IA SUFFISANT' },
    reliability: 'Fiabilité',
    rel: { HIGH: 'Élevée', MEDIUM: 'Moyenne', LOW: 'Faible' },
    signals: 'Signaux identifiés',
    why: 'Pourquoi ce résultat ?',
    limits: 'Limites importantes',
    provenance: 'Provenance (Content Credentials C2PA)',
    prov: {
      FOUND: 'Content Credentials détectés',
      NOT_FOUND: 'Aucun Content Credential détecté',
      ERROR: 'Content Credentials illisibles'
    },
    provNotFound: 'L’absence de Content Credentials est fréquente (les plateformes suppriment les métadonnées) et ne prouve pas une origine humaine.',
    provError: 'Ce fichier n’a pas pu être analysé pour C2PA. Cela ne dit rien de son origine.',
    provAi: 'Le manifeste déclare une génération par IA (digital source type).',
    provNoAi: 'Le manifeste ne déclare pas de génération par IA.',
    state: 'Validation',
    issuer: 'Signé par',
    generator: 'Créé avec',
    signedAt: 'Signé le',
    stateHelp: { Valid: 'signature et empreintes intactes', Trusted: 'signé par un certificat de confiance', Invalid: 'fichier modifié après signature ou signature invalide' },
    ref: 'Référence',
    textOff: 'Le détecteur de texte IA n’est pas encore disponible. Le détecteur d’image et le vérificateur C2PA fonctionnent déjà.'
  }
};

function Provenance({ p, t }: { p: ProvenanceResult; t: (typeof T)['en'] }) {
  return (
    <div className={`prov prov-${p.status.toLowerCase()}`}>
      <strong>{t.provenance}</strong>
      <div className="prov-status">{t.prov[p.status]}</div>
      {p.status === 'FOUND' && (
        <dl className="prov-dl">
          {p.validationState && (
            <>
              <dt>{t.state}</dt>
              <dd>
                {p.validationState}
                {p.validationState in t.stateHelp && ` — ${t.stateHelp[p.validationState as keyof typeof t.stateHelp]}`}
              </dd>
            </>
          )}
          {p.issuer && (
            <>
              <dt>{t.issuer}</dt>
              <dd>{p.issuer}</dd>
            </>
          )}
          {p.generator && (
            <>
              <dt>{t.generator}</dt>
              <dd>{p.generator}</dd>
            </>
          )}
          {p.signedAt && (
            <>
              <dt>{t.signedAt}</dt>
              <dd>{p.signedAt}</dd>
            </>
          )}
          <dt>AI</dt>
          <dd>{p.aiDeclared ? t.provAi : t.provNoAi}</dd>
        </dl>
      )}
      {p.status === 'NOT_FOUND' && <p className="small muted">{t.provNotFound}</p>}
      {p.status === 'ERROR' && <p className="small muted">{t.provError}</p>}
    </div>
  );
}

export default function Detector({ initialModality = 'image', locale, textAvailable = true }: Props) {
  const t = T[locale];
  const [modality, setModality] = useState<Modality>(initialModality);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function reset(next?: Modality) {
    if (next) setModality(next);
    setError(null);
    setResult(null);
    setProvenance(null);
  }

  function pickFile(f: File | null | undefined) {
    reset();
    if (!f) return setFile(null);
    if (!IMAGE_TYPES.includes(f.type)) {
      setFile(null);
      return setError(t.badType);
    }
    if (f.size > IMAGE_MAX) {
      setFile(null);
      return setError(t.tooBig);
    }
    setFile(f);
  }

  async function handleAnalyze() {
    reset();
    if (modality === 'text') {
      const len = text.trim().length;
      if (len < TEXT_MIN) return setError(t.textShort);
      if (len > TEXT_MAX) return setError(t.textLong);
    } else if (!file) {
      return setError(t.noFile);
    }

    if (modality === 'c2pa') {
      setLoading(true);
      setProvenance(await inspectProvenance(file!));
      setLoading(false);
      return;
    }

    if (!token) return setError(t.captcha);

    setLoading(true);
    const provenanceJob = modality === 'image' ? inspectProvenance(file!) : null;
    try {
      const formData = new FormData();
      formData.append('modality', modality);
      formData.append('locale', locale);
      formData.append('turnstileToken', token);
      if (modality === 'text') formData.append('text', text.trim());
      else formData.append('file', file!);

      let res: Response;
      try {
        res = await fetch('/api/analyze', { method: 'POST', body: formData });
      } catch {
        throw new Error(t.network);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || t.failed);
      setResult(data as AnalysisResult);
    } catch (err) {
      setError((err as Error).message || t.failed);
    } finally {
      if (provenanceJob) setProvenance(await provenanceJob);
      turnstileRef.current?.reset();
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }

  const tone = result ? (result.decision === 'AI_LIKELY' ? 'ai' : result.decision === 'INDETERMINATE' ? 'mid' : 'low') : '';

  return (
    <div className="card detector">
      <div className="tab-group" role="tablist">
        {(['image', 'text', 'c2pa'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modality === m}
            className={`tab-btn ${modality === m ? 'active' : ''}`}
            onClick={() => reset(m)}
          >
            {t.tabs[m]}
          </button>
        ))}
      </div>

      {modality === 'text' && !textAvailable && (
        <div className="notice" role="status">
          {t.textOff}
        </div>
      )}
      {modality === 'text' ? (
        <div>
          <textarea
            className="text-input"
            value={text}
            maxLength={TEXT_MAX}
            aria-label={t.tabs.text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.placeholder}
          />
          <div className="counter">
            <span>{t.min}</span>
            <span>
              {text.trim().length.toLocaleString(locale)} / {TEXT_MAX.toLocaleString(locale)}
            </span>
          </div>
        </div>
      ) : (
        <div
          className={`dropzone ${dragOver ? 'drag' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {preview && <img src={preview} alt="" className="preview" />}
          <p>{file ? file.name : t.drop}</p>
          <span className="small muted">{locale === 'fr' ? 'JPG, PNG, WEBP — 4 Mo max.' : 'JPG, PNG, WEBP — Max 4 MB'}</span>
          {modality === 'c2pa' && <span className="small muted block">{t.c2paLocal}</span>}
        </div>
      )}

      {modality !== 'c2pa' && <Turnstile ref={turnstileRef} onToken={setToken} locale={locale} />}

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <button className="btn" type="button" onClick={handleAnalyze} disabled={loading || (modality === 'text' && !textAvailable)} aria-busy={loading}>
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" /> {t.analyzing}
          </>
        ) : modality === 'c2pa' ? (
          t.inspect
        ) : (
          t.analyze
        )}
      </button>

      <div ref={resultRef} aria-live="polite">
        {result && (
          <div className="result">
            <div className={`result-header tone-${tone}`}>
              <div className="eyebrow">{t.estimate}</div>
              <div className="score-badge">{result.aiLikelihoodEstimate}%</div>
              <div className="meter" aria-hidden="true">
                <span style={{ width: `${result.aiLikelihoodEstimate}%` }} />
              </div>
              <div className="verdict-title">{t.verdict[result.decision]}</div>
              <div className="small muted">
                {t.reliability}
                {locale === 'fr' ? ' : ' : ': '}
                {t.rel[result.reliability]}
              </div>
            </div>

            <div className="result-grid">
              <div>
                <strong>{t.signals}</strong>
                {result.signals.map((sig, idx) => (
                  <div key={idx} className="signal-row">
                    <span>{sig.label}</span>
                    <span>{sig.value !== undefined ? `${sig.value}%` : sig.status}</span>
                  </div>
                ))}
              </div>
              <div>
                <strong>{t.why}</strong>
                {result.explanation.map((exp, idx) => (
                  <p key={idx} className="small muted mt">
                    {exp}
                  </p>
                ))}
              </div>
            </div>

            <div className="limitation-box">
              <strong>
                {t.limits}
                {locale === 'fr' ? ' :' : ':'}
              </strong>
              <ul>
                {result.limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
            <p className="tiny muted">
              {result.provider} · {t.ref} {result.requestId}
            </p>
          </div>
        )}
        {provenance && <Provenance p={provenance} t={t} />}
      </div>
    </div>
  );
}
