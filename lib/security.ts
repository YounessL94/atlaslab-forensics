import crypto from 'crypto';

const isProd = process.env.NODE_ENV === 'production';

export class ConfigError extends Error {}

/** Client IP. On Vercel, x-forwarded-for / x-real-ip are set by the edge and cannot be spoofed by the client. */
export function getClientIp(headers: Headers): string {
  const real = headers.get('x-real-ip');
  if (real) return real.trim();
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return '0.0.0.0';
}

/** Salted one-way hash; raw IPs are never stored or logged. */
export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt) {
    if (isProd) throw new ConfigError('RATE_LIMIT_SALT missing');
    return crypto.createHash('sha256').update('dev:' + ip).digest('hex').slice(0, 32);
  }
  return crypto.createHmac('sha256', salt).update(ip).digest('hex').slice(0, 32);
}

export async function verifyTurnstileToken(token: string | null, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (isProd) throw new ConfigError('TURNSTILE_SECRET_KEY missing');
    return true;
  }
  if (!token || token.length > 2048) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8000)
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verification error:', (err as Error).message);
    return false;
  }
}

function redisEnv(): { url: string; token: string } | null {
  // Vercel Marketplace Upstash integration injects KV_REST_API_*.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    if (isProd) throw new ConfigError('Upstash Redis env missing');
    return null;
  }
  return { url: url.replace(/\/$/, ''), token };
}

/** Runs Upstash REST commands in one pipeline. Returns null when Redis is not configured (dev only). */
export async function redisPipeline(commands: Array<Array<string | number>>): Promise<Array<{ result?: unknown; error?: string }> | null> {
  const env = redisEnv();
  if (!env) return null;
  const res = await fetch(`${env.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  return res.json();
}

export interface LimitRule {
  name: string;
  windowSec: number;
  max: number;
}

/**
 * Fixed-window counters. `subject` is an already-hashed IP (or 'global').
 * Fails open on transient Redis errors (Turnstile still gates abuse); fails closed on missing config in production.
 */
export async function checkRateLimit(subject: string, rules: LimitRule[]): Promise<{ allowed: boolean; rule?: string }> {
  const now = Math.floor(Date.now() / 1000);
  const keys = rules.map((r) => `rl:${r.name}:${subject}:${Math.floor(now / r.windowSec)}`);
  const commands: Array<Array<string | number>> = [];
  keys.forEach((k, i) => {
    commands.push(['INCR', k]);
    commands.push(['EXPIRE', k, rules[i].windowSec, 'NX']);
  });

  try {
    const data = await redisPipeline(commands);
    if (!data) return { allowed: true };
    for (let i = 0; i < rules.length; i++) {
      const count = Number(data[i * 2]?.result ?? 0);
      if (count > rules[i].max) return { allowed: false, rule: rules[i].name };
    }
    return { allowed: true };
  } catch (err) {
    if (err instanceof ConfigError) throw err;
    console.error('Rate limit error:', (err as Error).message);
    return { allowed: true };
  }
}

export async function incrementMetric(metricName: string) {
  const day = new Date().toISOString().slice(0, 10);
  try {
    await redisPipeline([
      ['INCR', `metrics:${day}:${metricName}`],
      ['EXPIRE', `metrics:${day}:${metricName}`, 60 * 60 * 24 * 90, 'NX']
    ]);
  } catch (err) {
    console.error('Metric increment failed:', (err as Error).message);
  }
}
