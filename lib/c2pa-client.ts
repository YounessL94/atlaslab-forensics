'use client';

// Must match the installed @contentauth/c2pa-web version (pinned in package.json).
const C2PA_WEB_VERSION = '0.15.3';
const WASM_SRC = `https://cdn.jsdelivr.net/npm/@contentauth/c2pa-web@${C2PA_WEB_VERSION}/dist/resources/c2pa_bg.wasm`;

export interface ProvenanceResult {
  status: 'FOUND' | 'NOT_FOUND' | 'ERROR';
  validationState?: string;
  issuer?: string;
  generator?: string;
  signedAt?: string;
  aiDeclared?: boolean;
  sourceTypes?: string[];
}

let c2paPromise: Promise<any> | null = null;

async function getC2pa() {
  if (!c2paPromise) {
    c2paPromise = import('@contentauth/c2pa-web').then(({ createC2pa }) => createC2pa({ wasmSrc: WASM_SRC }));
    c2paPromise.catch(() => {
      c2paPromise = null;
    });
  }
  return c2paPromise;
}

const AI_SOURCE_TYPES = ['trainedAlgorithmicMedia', 'compositeWithTrainedAlgorithmicMedia', 'algorithmicMedia'];

/** Reads C2PA Content Credentials locally in the browser. The file is never uploaded for this check. */
export async function inspectProvenance(file: File): Promise<ProvenanceResult> {
  try {
    const [{ Reader }, c2pa] = await Promise.all([import('@contentauth/c2pa-web'), getC2pa()]);
    const reader = await Reader.fromBlob(c2pa, file.type || undefined, file);
    if (!reader) return { status: 'NOT_FOUND' };
    try {
      const store: any = await reader.manifestStore();
      const manifest: any = store?.active_manifest ? store.manifests?.[store.active_manifest] : undefined;
      const sourceTypes: string[] = [];
      for (const a of manifest?.assertions ?? []) {
        if (typeof a?.label === 'string' && a.label.startsWith('c2pa.actions')) {
          for (const act of a?.data?.actions ?? []) {
            if (typeof act?.digitalSourceType === 'string') sourceTypes.push(act.digitalSourceType.split('/').pop());
          }
        }
      }
      const generator =
        manifest?.claim_generator_info?.map((g: any) => [g?.name, g?.version].filter(Boolean).join(' ')).filter(Boolean).join(', ') ||
        manifest?.claim_generator ||
        undefined;
      return {
        status: 'FOUND',
        validationState: store?.validation_state ?? undefined,
        issuer: manifest?.signature_info?.issuer ?? undefined,
        signedAt: manifest?.signature_info?.time ?? undefined,
        generator,
        sourceTypes: Array.from(new Set(sourceTypes)),
        aiDeclared: sourceTypes.some((s) => AI_SOURCE_TYPES.includes(s))
      };
    } finally {
      await reader.free().catch(() => undefined);
    }
  } catch (err) {
    console.warn('C2PA inspection failed', err);
    return { status: 'ERROR' };
  }
}
