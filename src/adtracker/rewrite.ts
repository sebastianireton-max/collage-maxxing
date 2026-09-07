/**
 * "Then it writes me my own version of it."
 *
 * The rewrite step takes a competitor's ad — its copy and, when we have it, the
 * transcript of its video — and drafts the tenant's own version.
 *
 * Two rules shape this file:
 *
 *  1. It adapts an angle, it does not copy an ad. Reproducing a competitor's
 *     script with the names swapped is both worthless (the audience has seen it)
 *     and someone else's copyright. The prompt asks for the *strategy* to be
 *     named and a fresh execution written against it.
 *  2. A prompt instruction is a request; a post-check is a guarantee. Forbidden
 *     claims and required disclaimers are both stated in the prompt AND verified
 *     on the output, because a model that ignores an instruction under pressure
 *     is the normal case, not the exceptional one.
 */
import type { Ad, ModelProvider, Rewrite, TenantBrand, Transcript } from './types.js';

export class RewriteRejected extends Error {
  constructor(readonly reasons: string[]) {
    super(`Rewrite rejected: ${reasons.join('; ')}`);
    this.name = 'RewriteRejected';
  }
}

const SYSTEM = `You are a direct-response copywriter studying a competitor's ad for a client.

Your job is to name the STRATEGY the competitor is using, then write the client's
own execution of that strategy. You are adapting an approach, never rewording
their script. If your draft could be mistaken for a lightly-edited copy of the
original, you have failed the task.

Return strict JSON with exactly these keys:
  "angleObserved" - one sentence naming the persuasion angle the original runs
                    (e.g. "authority + specific timeframe", "problem agitation
                    against a named alternative").
  "hook"          - the first line of the client's version. One sentence.
  "script"        - the client's full ad, ready to record or run.
  "rationale"     - what you kept from the strategy, what you changed for this
                    client, and why.

Never invent statistics, testimonials, customer counts, prices, guarantees or
results. If the original leans on a number the client cannot substantiate, say so
in the rationale and build the angle without it.`;

function buildUserPrompt(ad: Ad, transcript: Transcript | undefined, brand: TenantBrand): string {
  const parts: string[] = [];

  parts.push(`# The client`);
  parts.push(`Business: ${brand.businessName}`);
  parts.push(`Offer: ${brand.offer}`);
  parts.push(`Audience: ${brand.audience}`);
  if (brand.toneGuidance) parts.push(`Voice: ${brand.toneGuidance}`);

  if (brand.forbiddenClaims?.length) {
    parts.push(
      `\n# Claims this client must never make\n` +
        brand.forbiddenClaims.map((c) => `- ${c}`).join('\n') +
        `\nThese are legal limits, not stylistic preferences. An angle that only works by breaking one of them must be replaced, not softened.`,
    );
  }
  if (brand.requiredDisclaimer) {
    parts.push(`\n# Required in the script, verbatim\n"${brand.requiredDisclaimer}"`);
  }

  parts.push(`\n# The competitor's ad`);
  if (ad.creative.headline) parts.push(`Headline: ${ad.creative.headline}`);
  if (ad.creative.bodyText) parts.push(`Body copy:\n${ad.creative.bodyText}`);
  if (ad.creative.callToAction) parts.push(`Call to action: ${ad.creative.callToAction}`);
  if (transcript?.text) parts.push(`\nTranscript of the video:\n${transcript.text}`);

  if (!ad.creative.bodyText && !transcript?.text) {
    parts.push(
      `\n(Only metadata is available for this ad — no copy and no transcript. Say so in the rationale and do not invent what the ad said.)`,
    );
  }

  return parts.join('\n');
}

/** Pulls the first JSON object out of a response that may be fenced or prefixed. */
export function parseJsonObject(raw: string): Record<string, unknown> {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(raw);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object in model response');
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Checks a generated script against the tenant's hard limits.
 * Returns the reasons it fails, empty when it passes.
 */
export function validateRewrite(rewrite: Rewrite, brand: TenantBrand): string[] {
  const reasons: string[] = [];
  const haystack = `${rewrite.hook}\n${rewrite.script}`.toLowerCase();

  for (const claim of brand.forbiddenClaims ?? []) {
    const needle = claim.toLowerCase().trim();
    if (needle && haystack.includes(needle)) reasons.push(`contains a forbidden claim: "${claim}"`);
  }
  if (brand.requiredDisclaimer && !rewrite.script.includes(brand.requiredDisclaimer)) {
    reasons.push(`missing the required disclaimer: "${brand.requiredDisclaimer}"`);
  }
  if (!rewrite.hook.trim()) reasons.push('empty hook');
  if (!rewrite.script.trim()) reasons.push('empty script');
  return reasons;
}

export interface RewriteOptions {
  ad: Ad;
  transcript?: Transcript;
  brand: TenantBrand;
  provider: ModelProvider;
  /** Retries once on a validation failure, telling the model what it broke. */
  retryOnViolation?: boolean;
}

export async function rewriteAd(opts: RewriteOptions): Promise<Rewrite> {
  const { ad, transcript, brand, provider } = opts;

  const attempt = async (extraInstruction?: string): Promise<Rewrite> => {
    const messages = [
      { role: 'system' as const, content: SYSTEM },
      { role: 'user' as const, content: buildUserPrompt(ad, transcript, brand) },
    ];
    if (extraInstruction) messages.push({ role: 'user' as const, content: extraInstruction });

    const raw = await provider.complete({ messages, json: true, maxTokens: 2000, temperature: 0.8 });
    const obj = parseJsonObject(raw);

    return {
      adId: ad.id,
      angleObserved: String(obj.angleObserved ?? '').trim(),
      hook: String(obj.hook ?? '').trim(),
      script: String(obj.script ?? '').trim(),
      rationale: String(obj.rationale ?? '').trim(),
      provider: provider.name,
      model: provider.model,
    };
  };

  let rewrite = await attempt();
  let reasons = validateRewrite(rewrite, brand);

  if (reasons.length && opts.retryOnViolation !== false) {
    rewrite = await attempt(
      `Your previous draft was rejected for these reasons:\n${reasons.map((r) => `- ${r}`).join('\n')}\n` +
        `Rewrite it so none of them apply. Do not argue the point or explain the constraint; just produce a compliant draft.`,
    );
    reasons = validateRewrite(rewrite, brand);
  }

  // Fail loudly rather than hand back a draft that breaks a legal limit. The
  // caller can show the violation; it must not quietly reach a publish button.
  if (reasons.length) throw new RewriteRejected(reasons);
  return rewrite;
}
