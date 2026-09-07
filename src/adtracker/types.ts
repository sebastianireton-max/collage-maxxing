/**
 * Competitor ad tracker — the shape of the system.
 *
 * Four capabilities, in order: collect the ads a competitor is running, let a
 * human open the creative, transcribe it, and draft your own version of it.
 *
 * Two things are deliberately behind interfaces, because they are the two that
 * differ per customer when this is white-labelled:
 *
 *  - `AdSource`     — where ads come from. The Meta Ad Library API only returns
 *                     commercial ads for EU/UK audiences, so a US business has
 *                     to get them another way. No single source works for
 *                     everyone; the system must not assume one.
 *  - `ModelProvider` — which LLM writes the rewrite. "Any AI model" is a real
 *                     requirement, not a nicety: teams already have a provider
 *                     and a key, and will not adopt a tool that mandates another.
 */

export interface Competitor {
  id: string;
  /** Display name, e.g. "Adam Hayley - Online Trainer Education". */
  name: string;
  /** Platform-specific page/advertiser id, when the source has one. */
  pageId?: string;
  /** Their site, used to brand-match a rewrite against their positioning. */
  websiteUrl?: string;
  notes?: string;
}

export type AdMediaKind = 'video' | 'image' | 'carousel' | 'text';

export interface AdCreative {
  kind: AdMediaKind;
  /** Direct media URL when the source exposes one. */
  mediaUrl?: string;
  thumbnailUrl?: string;
  /** Body copy / primary text of the ad. */
  bodyText?: string;
  headline?: string;
  callToAction?: string;
  /** Where the ad sends people. */
  landingUrl?: string;
}

export interface Ad {
  /** Stable id within its source, e.g. the Meta ad archive id. */
  id: string;
  source: string;
  competitorId: string;
  /** Permalink to the ad in its library, so a human can always verify. */
  permalink?: string;
  creative: AdCreative;
  firstSeen?: string;
  lastSeen?: string;
  /** True when the library still reports it as delivering. */
  active?: boolean;
  platforms?: string[];
  /** Anything the source gave us that does not fit above. Never invented. */
  raw?: Record<string, unknown>;
}

/** A run of an ad's spoken audio, with timings when the transcriber gives them. */
export interface Transcript {
  adId: string;
  text: string;
  language?: string;
  segments?: { start: number; end: number; text: string }[];
  /** Which transcriber produced it, for provenance. */
  provider: string;
}

/** The "write me my own version" output. */
export interface Rewrite {
  adId: string;
  /** The angle the original is running, named plainly. */
  angleObserved: string;
  hook: string;
  script: string;
  /** Why this version differs — what was kept, what was changed and why. */
  rationale: string;
  provider: string;
  model: string;
}

// ---------------------------------------------------------------- interfaces

export interface AdSourceQuery {
  competitor: Competitor;
  /** ISO country codes the ads were delivered to. */
  countries?: string[];
  activeOnly?: boolean;
  limit?: number;
}

/**
 * Where ads come from. Implementations must not throw on a competitor with no
 * ads — an empty list is a normal answer and the dashboard has to render it.
 */
export interface AdSource {
  readonly name: string;
  /**
   * Human-readable statement of what this source can and cannot see, shown in
   * the UI. A source that silently returns nothing outside the EU is worse than
   * useless — it looks like the competitor stopped advertising.
   */
  readonly coverage: string;
  fetchAds(query: AdSourceQuery): Promise<Ad[]>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  /** Upper bound on output tokens. Providers name this differently. */
  maxTokens?: number;
  temperature?: number;
  /** Ask for strict JSON when the provider supports it. */
  json?: boolean;
}

/**
 * Any chat-completion model. Kept to the narrowest surface that the rewrite
 * step actually needs, so adding a provider is a small adapter rather than a
 * port of somebody's whole SDK.
 */
export interface ModelProvider {
  readonly name: string;
  readonly model: string;
  complete(req: CompletionRequest): Promise<string>;
}

/** Speech to text. Pluggable for the same reason the model is. */
export interface Transcriber {
  readonly name: string;
  transcribe(mediaUrl: string, adId: string): Promise<Transcript>;
}

/** Per-tenant branding and positioning — the white-label surface. */
export interface TenantBrand {
  /** The business this tracker belongs to. */
  businessName: string;
  /** What they sell, in their own words. Feeds the rewrite prompt. */
  offer: string;
  /** Who they sell to. */
  audience: string;
  /** Voice guidance, e.g. "clinical, unhyped, no emoji". */
  toneGuidance?: string;
  /**
   * Claims this tenant must never make. Enforced in the rewrite prompt AND
   * checked after generation, because a prompt instruction is a request and a
   * post-check is a guarantee.
   */
  forbiddenClaims?: string[];
  /** Text that must appear on every generated script, e.g. an RUO disclaimer. */
  requiredDisclaimer?: string;
}
