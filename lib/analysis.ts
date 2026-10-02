import crypto from 'crypto';
import { THRESHOLDS, Locale } from './config';
import { ConfigError } from './security';

export type Decision = 'AI_LIKELY' | 'INDETERMINATE' | 'NO_SUFFICIENT_AI_SIGNAL';
export type Reliability = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Signal {
  label: string;
  value?: number;
  status?: string;
}

export interface AnalysisResult {
  modality: 'image' | 'text';
  decision: Decision;
  aiLikelihoodEstimate: number;
  reliability: Reliability;
  signals: Signal[];
  explanation: string[];
  limitations: string[];
  provider: string;
  latencyMs: number;
  requestId: string;
}

export class ProviderError extends Error {}

// V2 = Enterprise project keys (one per model). V3 = self-serve key (one key for all "Playground Available" models).
// AI text detection is only available as a V2 Enterprise project; V3 self-serve covers images/video/audio.
const HIVE_V2_SYNC_URL = 'https://api.thehive.ai/api/v2/task/sync';
const HIVE_V3_IMAGE_URL = 'https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection';
// Self-serve AI text detection (EN, FR and other languages). Used when no Hive Enterprise text key is configured.
const WINSTON_TEXT_URL = 'https://api.gowinston.ai/v2/ai-content-detection';

/** True when a text-detection provider is configured (evaluated server-side only). */
export const textDetectionAvailable = () => !!(process.env.HIVE_TEXT_API_KEY || process.env.WINSTON_API_KEY);

// Source-head classes that are not a generator name.
const NON_SOURCE_CLASSES = new Set(['ai_generated', 'not_ai_generated', 'none', 'inconclusive', 'inconclusive_video', 'deepfake']);

interface HiveClass {
  class?: string;
  score?: number; // V2
  value?: number; // V3
  [k: string]: unknown;
}

const classScore = (c?: HiveClass) => (typeof c?.score === 'number' ? c.score : typeof c?.value === 'number' ? c.value : undefined);

// Hive wraps results as { status: [ { status, response } ] }; docs samples sometimes show the inner object only.
function hiveResponse(data: any): any {
  const entry = Array.isArray(data?.status) ? data.status[0] : data;
  const code = entry?.status?.code;
  if (code !== undefined && String(code) !== '0') {
    throw new ProviderError(`Hive task status ${code}: ${entry?.status?.message ?? ''}`);
  }
  const response = entry?.response;
  if (!response) throw new ProviderError('Hive response missing');
  return response;
}

async function callHiveV2(apiKey: string, body: BodyInit, json: boolean): Promise<any> {
  const res = await fetch(HIVE_V2_SYNC_URL, {
    method: 'POST',
    headers: {
      authorization: `token ${apiKey}`,
      accept: 'application/json',
      ...(json ? { 'content-type': 'application/json' } : {})
    },
    body,
    signal: AbortSignal.timeout(25000)
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    throw new ProviderError(`Hive HTTP ${res.status} ${detail}`);
  }
  return hiveResponse(await res.json());
}

async function callHiveV3Image(apiKey: string, buf: Buffer, mimeType: string): Promise<any> {
  const res = await fetch(HIVE_V3_IMAGE_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ input: [{ media_base64: `data:${mimeType};base64,${buf.toString('base64')}` }] }),
    signal: AbortSignal.timeout(25000)
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    throw new ProviderError(`Hive V3 HTTP ${res.status} ${detail}`);
  }
  const data = await res.json();
  const output = data?.output ?? data?.response?.output ?? data?.status?.[0]?.response?.output;
  if (!Array.isArray(output)) throw new ProviderError('Hive V3 response missing output');
  return { output };
}

async function callWinston(apiKey: string, text: string): Promise<any> {
  const res = await fetch(WINSTON_TEXT_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ text, language: 'auto', sentences: true }),
    signal: AbortSignal.timeout(25000)
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    throw new ProviderError(`Winston HTTP ${res.status} ${detail}`);
  }
  return res.json();
}

function pct(x: number): number {
  // Never display 0% or 100%: a classifier score is not certainty.
  return Math.min(99.9, Math.max(0.1, Math.round(x * 1000) / 10));
}

export function parseHiveImage(response: any, isFr: boolean): { score: number; signals: Signal[]; sourceConfident: boolean } {
  const classes: HiveClass[] = response?.output?.[0]?.classes ?? [];
  const find = (name: string) => classScore(classes.find((c) => c.class === name));
  const ai = find('ai_generated');
  if (typeof ai !== 'number') throw new ProviderError('Hive image output missing ai_generated class');

  const signals: Signal[] = [{ label: isFr ? 'Détecteur visuel IA (classe ai_generated)' : 'AI-generated media classifier', value: pct(ai) }];

  const sources = classes
    .map((c) => ({ name: c.class, score: classScore(c) }))
    .filter((c): c is { name: string; score: number } => !!c.name && typeof c.score === 'number' && !NON_SOURCE_CLASSES.has(c.name) && !c.name.includes('audio'))
    .sort((a, b) => b.score - a.score);
  const top = sources[0];
  const sourceConfident = !!top && top.score >= 0.5;
  if (ai >= 0.5 && top && sourceConfident) {
    signals.push({
      label: isFr ? `Générateur le plus proche : ${top.name}` : `Closest known generator: ${top.name}`,
      value: pct(top.score)
    });
  }

  const deepfake = find('deepfake');
  if (typeof deepfake === 'number') {
    signals.push({ label: isFr ? 'Signal deepfake (visages)' : 'Deepfake signal (faces)', value: pct(deepfake) });
  }
  return { score: pct(ai), signals, sourceConfident };
}

export function parseHiveText(response: any, isFr: boolean): { score: number; signals: Signal[]; segmentSpread: number } {
  const agg = (response?.aggregate_score as HiveClass[] | undefined)?.find((c) => c.class === 'ai_generated')?.score;
  const segments: number[] = (response?.output ?? [])
    .map((o: any) => {
      const c = o?.classes?.[0];
      if (!c) return undefined;
      if (typeof c.ai_generated === 'number') return c.ai_generated;
      if (c.class === 'ai_generated' && typeof c.score === 'number') return c.score;
      return undefined;
    })
    .filter((x: unknown): x is number => typeof x === 'number');

  const overall = typeof agg === 'number' ? agg : segments.length ? segments.reduce((a, b) => a + b, 0) / segments.length : undefined;
  if (typeof overall !== 'number') throw new ProviderError('Hive text output missing ai_generated score');

  const signals: Signal[] = [{ label: isFr ? 'Score global du texte' : 'Aggregate text score', value: pct(overall) }];
  if (segments.length > 1) {
    segments.slice(0, 10).forEach((s, i) => {
      signals.push({ label: isFr ? `Segment ${i + 1}` : `Segment ${i + 1}`, value: pct(s) });
    });
  }
  const spread = segments.length > 1 ? Math.max(...segments) - Math.min(...segments) : 0;
  return { score: pct(overall), signals, segmentSpread: spread };
}

// Winston returns a *human* score 0-100 (higher = more human); we convert to an AI likelihood.
export function parseWinston(data: any, isFr: boolean): { score: number; signals: Signal[]; segmentSpread: number } {
  if (typeof data?.score !== 'number') throw new ProviderError('Winston response missing score');
  const ai = 1 - data.score / 100;
  const signals: Signal[] = [{ label: isFr ? 'Score global du texte' : 'Aggregate text score', value: pct(ai) }];

  const sentences: number[] = (Array.isArray(data.sentences) ? data.sentences : [])
    .map((s: any) => s?.score)
    .filter((x: unknown): x is number => typeof x === 'number');
  let segmentSpread = 0;
  if (sentences.length >= 3) {
    const flagged = sentences.filter((h) => h < 50).length;
    signals.push({
      label: isFr ? 'Phrases au profil IA' : 'Sentences with AI-like patterns',
      status: `${flagged} / ${sentences.length}`
    });
    // A substantial share of both AI-like and human-like sentences suggests mixed or edited text.
    const share = flagged / sentences.length;
    if (sentences.length >= 4 && share >= 0.25 && share <= 0.75) segmentSpread = 0.6;
  }
  const attack = data?.attack_detected;
  if (attack?.zero_width_space || attack?.homoglyph_attack) {
    signals.push({
      label: isFr ? 'Caractères invisibles ou homoglyphes' : 'Hidden characters or homoglyphs',
      status: isFr ? 'Détectés' : 'Detected'
    });
  }
  if (typeof data?.language === 'string') {
    signals.push({ label: isFr ? 'Langue détectée' : 'Detected language', status: data.language.toUpperCase() });
  }
  return { score: pct(ai), signals, segmentSpread };
}

// Name kept for compatibility: routes image detection to Hive and text detection to Hive (Enterprise) or Winston.
export async function analyzeWithHive(
  modality: 'image' | 'text',
  payload: { text?: string; fileBuffer?: Buffer; fileName?: string; mimeType?: string },
  locale: Locale
): Promise<AnalysisResult> {
  const startTime = Date.now();
  const requestId = 'req_' + crypto.randomBytes(6).toString('hex');
  const isFr = locale === 'fr';

  const v2Key = modality === 'text' ? process.env.HIVE_TEXT_API_KEY : process.env.HIVE_IMAGE_API_KEY;
  const v3Key = modality === 'image' ? process.env.HIVE_API_KEY : undefined;
  const winstonKey = modality === 'text' ? process.env.WINSTON_API_KEY : undefined;

  if (!v2Key && !v3Key && !winstonKey) {
    if (process.env.NODE_ENV !== 'production' && process.env.HIVE_MOCK === '1') {
      return devMock(modality, payload, locale, requestId);
    }
    throw new ConfigError(`Hive API key missing for ${modality}`);
  }

  if (modality === 'text') {
    const text = payload.text || '';
    if (v2Key) {
      const response = await callHiveV2(v2Key, JSON.stringify({ text_data: text }), true);
      const { score, signals, segmentSpread } = parseHiveText(response, isFr);
      return normalizeVerdict({ modality, score, signals, locale, requestId, latencyMs: Date.now() - startTime, textLength: text.length, segmentSpread });
    }
    const { score, signals, segmentSpread } = parseWinston(await callWinston(winstonKey!, text), isFr);
    return normalizeVerdict({
      modality, score, signals, locale, requestId, latencyMs: Date.now() - startTime,
      textLength: text.length, segmentSpread, provider: 'Winston AI text detection'
    });
  }

  let response: any;
  if (v2Key) {
    const form = new FormData();
    form.append('media', new Blob([new Uint8Array(payload.fileBuffer!)], { type: payload.mimeType }), payload.fileName || 'upload');
    response = await callHiveV2(v2Key, form, false);
  } else {
    response = await callHiveV3Image(v3Key!, payload.fileBuffer!, payload.mimeType || 'image/jpeg');
  }
  const { score, signals } = parseHiveImage(response, isFr);
  return normalizeVerdict({ modality, score, signals, locale, requestId, latencyMs: Date.now() - startTime });
}

export function normalizeVerdict(args: {
  modality: 'image' | 'text';
  score: number;
  signals: Signal[];
  locale: Locale;
  requestId: string;
  latencyMs: number;
  textLength?: number;
  segmentSpread?: number;
  provider?: string;
}): AnalysisResult {
  const { modality, score, signals, locale, requestId, latencyMs, textLength, segmentSpread = 0 } = args;
  const isFr = locale === 'fr';

  let decision: Decision;
  let reliability: Reliability;
  if (score >= THRESHOLDS.AI_LIKELY_HIGH) {
    decision = 'AI_LIKELY';
    reliability = score >= 97 ? 'HIGH' : 'MEDIUM';
  } else if (score >= THRESHOLDS.AI_LIKELY_MED) {
    decision = 'AI_LIKELY';
    reliability = 'LOW';
  } else if (score > THRESHOLDS.INDETERMINATE_LOW) {
    decision = 'INDETERMINATE';
    reliability = 'LOW';
  } else {
    decision = 'NO_SUFFICIENT_AI_SIGNAL';
    // Absence of a signal is never strong evidence of human origin: cap at MEDIUM.
    reliability = 'MEDIUM';
  }

  const notes: string[] = [];
  if (modality === 'text' && textLength !== undefined) {
    if (textLength < 600) {
      reliability = 'LOW';
      if (decision === 'AI_LIKELY' && score < THRESHOLDS.AI_LIKELY_HIGH) decision = 'INDETERMINATE';
      notes.push(isFr ? 'Texte court : la fiabilité est réduite.' : 'Short text: reliability is reduced.');
    } else if (textLength < 1500 && reliability === 'HIGH') {
      reliability = 'MEDIUM';
    }
  }
  if (segmentSpread >= 0.6) {
    reliability = 'LOW';
    if (decision !== 'INDETERMINATE' && score < 90 && score > 10) decision = 'INDETERMINATE';
    notes.push(
      isFr
        ? 'Les segments du texte divergent fortement : le texte peut être mixte (humain + IA) ou retravaillé.'
        : 'Text segments disagree strongly: the text may be mixed (human + AI) or heavily edited.'
    );
  }

  const explanation = [
    isFr
      ? decision === 'AI_LIKELY'
        ? 'Le détecteur signale des caractéristiques fortement associées à une génération par IA.'
        : decision === 'INDETERMINATE'
        ? 'Le score se situe dans la zone d’incertitude : les indices ne permettent pas de conclure.'
        : 'Aucun motif caractéristique de génération par IA n’a été détecté avec une confiance suffisante. Cela ne prouve pas une origine humaine.'
      : decision === 'AI_LIKELY'
      ? 'The detector reports characteristics strongly associated with AI generation.'
      : decision === 'INDETERMINATE'
      ? 'The score falls inside the uncertainty zone: the evidence does not support a conclusion.'
      : 'No distinctive AI-generation patterns were detected with sufficient confidence. This does not prove human origin.',
    ...notes
  ];

  const limitations = isFr
    ? [
        'Ce résultat est probabiliste et ne constitue pas une preuve d’origine ou de paternité.',
        modality === 'image'
          ? 'Recompression, captures d’écran, redimensionnement ou retouches peuvent masquer ou imiter des signaux.'
          : 'Textes courts, normés, traduits ou rédigés par des non-natifs peuvent produire des faux positifs.',
        'N’utilisez pas ce résultat comme seule base d’une décision disciplinaire, professionnelle ou juridique.'
      ]
    : [
        'This result is probabilistic and is not proof of origin or authorship.',
        modality === 'image'
          ? 'Recompression, screenshots, resizing or edits can hide or mimic signals.'
          : 'Short, formulaic, translated or non-native writing can produce false positives.',
        'Do not use this result as the sole basis for disciplinary, professional or legal decisions.'
      ];

  return {
    modality,
    decision,
    aiLikelihoodEstimate: score,
    reliability,
    signals,
    explanation,
    limitations,
    provider: args.provider ?? 'Hive AI-generated content detection',
    latencyMs,
    requestId
  };
}

// Local development only (HIVE_MOCK=1, no key, NODE_ENV !== production). Clearly labelled; never reachable in production.
function devMock(modality: 'image' | 'text', payload: { text?: string; fileBuffer?: Buffer }, locale: Locale, requestId: string): AnalysisResult {
  const seed = crypto.createHash('sha256').update(payload.text ?? payload.fileBuffer ?? '').digest()[0];
  const score = Math.round((seed / 255) * 1000) / 10;
  return normalizeVerdict({
    modality,
    score,
    signals: [{ label: 'DEV MOCK — not a real analysis', value: score }],
    locale,
    requestId,
    latencyMs: 0,
    textLength: payload.text?.length,
    provider: 'DEV MOCK'
  });
}
