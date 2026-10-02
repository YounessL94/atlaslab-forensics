import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken, hashIp, getClientIp, checkRateLimit, incrementMetric, ConfigError } from '@/lib/security';
import { analyzeWithHive, ProviderError } from '@/lib/analysis';
import { THRESHOLDS } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MESSAGES = {
  en: {
    rate: 'Too many analyses. Please wait a moment and try again.',
    daily: 'Daily free analysis limit reached. Please come back tomorrow.',
    busy: 'The free service is at capacity today. Please try again tomorrow.',
    captcha: 'Security verification failed. Please complete the check and try again.',
    textShort: `Text too short. Minimum ${THRESHOLDS.TEXT_MIN_CHARS} characters.`,
    textLong: `Text too long. Maximum ${THRESHOLDS.TEXT_MAX_CHARS.toLocaleString('en')} characters.`,
    noFile: 'No image file provided.',
    tooBig: 'File exceeds the 4 MB limit.',
    badType: 'Unsupported file. Upload a JPG, PNG or WEBP image.',
    bad: 'Invalid request.',
    unavailable: 'Analysis service temporarily unavailable. Please try again later.',
    textOff: 'The AI text detector is not available yet. The image detector and C2PA checker are available.'
  },
  fr: {
    rate: 'Trop d’analyses. Patientez un instant puis réessayez.',
    daily: 'Limite quotidienne d’analyses gratuites atteinte. Revenez demain.',
    busy: 'Le service gratuit est saturé aujourd’hui. Réessayez demain.',
    captcha: 'Échec de la vérification de sécurité. Validez le contrôle et réessayez.',
    textShort: `Texte trop court. Minimum ${THRESHOLDS.TEXT_MIN_CHARS} caractères.`,
    textLong: `Texte trop long. Maximum ${THRESHOLDS.TEXT_MAX_CHARS.toLocaleString('fr')} caractères.`,
    noFile: 'Aucun fichier image fourni.',
    tooBig: 'Le fichier dépasse la limite de 4 Mo.',
    badType: 'Fichier non pris en charge. Importez une image JPG, PNG ou WEBP.',
    bad: 'Requête invalide.',
    unavailable: 'Service d’analyse temporairement indisponible. Réessayez plus tard.',
    textOff: 'Le détecteur de texte IA n’est pas encore disponible. Le détecteur d’image et le vérificateur C2PA fonctionnent.'
  }
};

/** Detects the real image type from magic bytes (client MIME type is not trusted). */
function sniffImage(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: NextRequest) {
  let m = MESSAGES.en;
  try {
    const declared = Number(req.headers.get('content-length') || 0);
    if (declared > THRESHOLDS.IMAGE_MAX_BYTES + 512 * 1024) return json({ error: m.tooBig }, 413);

    const ip = getClientIp(req.headers);
    const ipHash = hashIp(ip);

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return json({ error: m.bad }, 400);
    }
    const locale = form.get('locale') === 'fr' ? 'fr' : 'en';
    m = MESSAGES[locale];
    const modality = form.get('modality');
    if (modality !== 'image' && modality !== 'text') return json({ error: m.bad }, 400);

    // Text detection needs a Hive V2 Enterprise project key; fail fast with an honest message.
    if (modality === 'text' && !process.env.HIVE_TEXT_API_KEY && process.env.HIVE_MOCK !== '1') {
      await incrementMetric('err_text_unavailable');
      return json({ error: m.textOff }, 503);
    }

    // Validate input before spending a Turnstile check or rate-limit slot.
    let text = '';
    let buffer: Buffer | null = null;
    let mimeType: ReturnType<typeof sniffImage> = null;
    if (modality === 'text') {
      const raw = form.get('text');
      text = typeof raw === 'string' ? raw.trim() : '';
      if (text.length < THRESHOLDS.TEXT_MIN_CHARS) return json({ error: m.textShort }, 400);
      if (text.length > THRESHOLDS.TEXT_MAX_CHARS) return json({ error: m.textLong }, 400);
    } else {
      const raw = form.get('file');
      if (!(raw instanceof File) || raw.size === 0) return json({ error: m.noFile }, 400);
      if (raw.size > THRESHOLDS.IMAGE_MAX_BYTES) return json({ error: m.tooBig }, 413);
      buffer = Buffer.from(await raw.arrayBuffer());
      mimeType = sniffImage(buffer);
      if (!mimeType) return json({ error: m.badType }, 415);
    }

    const token = form.get('turnstileToken');
    if (!(await verifyTurnstileToken(typeof token === 'string' ? token : null, ip))) {
      await incrementMetric('err_turnstile');
      return json({ error: m.captcha }, 403);
    }

    const perIp = await checkRateLimit(ipHash, [
      { name: 'scan_min', windowSec: 60, max: 5 },
      { name: 'scan_day', windowSec: 86400, max: Number(process.env.DAILY_IP_LIMIT || 40) }
    ]);
    if (!perIp.allowed) {
      await incrementMetric('err_rate_limited');
      return json({ error: perIp.rule === 'scan_day' ? m.daily : m.rate }, 429);
    }
    const global = await checkRateLimit('global', [
      { name: 'scan_global_day', windowSec: 86400, max: Number(process.env.DAILY_GLOBAL_LIMIT || 90) }
    ]);
    if (!global.allowed) {
      await incrementMetric('err_global_cap');
      return json({ error: m.busy }, 429);
    }

    if (modality === 'text') {
      const result = await analyzeWithHive('text', { text }, locale);
      await incrementMetric('text_scans');
      return json(result);
    }

    const ext = mimeType!.split('/')[1].replace('jpeg', 'jpg');
    const result = await analyzeWithHive('image', { fileBuffer: buffer!, fileName: `upload.${ext}`, mimeType: mimeType! }, locale);
    await incrementMetric('image_scans');
    return json(result);
  } catch (err) {
    if (err instanceof ConfigError) console.error('Config error:', err.message);
    else if (err instanceof ProviderError) console.error('Provider error:', err.message);
    else console.error('Analyze error:', (err as Error)?.message);
    const providerBusy = err instanceof ProviderError && / 429 /.test(err.message);
    await incrementMetric(err instanceof ConfigError ? 'err_config' : providerBusy ? 'err_provider_quota' : 'err_provider');
    return json({ error: providerBusy ? m.busy : m.unavailable }, 503);
  }
}
