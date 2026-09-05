/** Colour maths for palette extraction. No dependencies — this is all arithmetic. */

export interface Rgb { r: number; g: number; b: number }

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export function toHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('');
}

/** Parses #rgb, #rrggbb, rgb()/rgba(), and hsl()/hsla(). Returns null for anything else. */
export function parseColor(raw: string): Rgb | null {
  const s = raw.trim().toLowerCase();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (hex) {
    let h = hex[1]!;
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
    else h = h.slice(0, 6);
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(s);
  if (rgb) {
    const parts = rgb[1]!.split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    // A 0 alpha means invisible — not a brand colour.
    if (parts.length > 3 && parseFloat(parts[3]!) === 0) return null;
    const [r, g, b] = parts.slice(0, 3).map((p) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p)));
    if ([r, g, b].some((n) => !Number.isFinite(n))) return null;
    return { r: clamp(r!), g: clamp(g!), b: clamp(b!) };
  }

  const hsl = /^hsla?\(([^)]+)\)$/.exec(s);
  if (hsl) {
    const parts = hsl[1]!.split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    if (parts.length > 3 && parseFloat(parts[3]!) === 0) return null;
    const h = parseFloat(parts[0]!);
    const sat = parseFloat(parts[1]!) / 100;
    const l = parseFloat(parts[2]!) / 100;
    if ([h, sat, l].some((n) => !Number.isFinite(n))) return null;
    return hslToRgb(h, sat, l);
  }

  return null;
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  return { r: clamp((r1 + m) * 255), g: clamp((g1 + m) * 255), b: clamp((b1 + m) * 255) };
}

/** Relative luminance, WCAG 2.1 definition. */
export function luminance({ r, g, b }: Rgb): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** 0 = grey, 1 = fully saturated. Greys are chrome, not brand. */
export function saturation({ r, g, b }: Rgb): number {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx === 0) return 0;
  return (mx - mn) / mx;
}

/** Perceptual-ish distance. Cheap, and good enough to collapse near-duplicate shades. */
export function distance(a: Rgb, b: Rgb): number {
  const rm = (a.r + b.r) / 2;
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

/**
 * Is this colour usable as a brand colour, rather than page chrome?
 * Rejects near-white, near-black and unsaturated greys — the colours every site has.
 */
export function isBrandCandidate(c: Rgb): boolean {
  const lum = luminance(c);
  if (lum > 0.88 || lum < 0.02) return false;
  return saturation(c) >= 0.18;
}

/** Picks whichever of black/white reads on top of the given colour. */
export function readableOn(c: Rgb): string {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 17, g: 17, b: 17 };
  return contrastRatio(c, white) >= contrastRatio(c, black) ? toHex(white) : toHex(black);
}

/** Darkens or lightens toward the given luminance target. Used to derive ink/paper. */
export function shift(c: Rgb, amount: number): Rgb {
  const t = amount > 0 ? 255 : 0;
  const k = Math.abs(amount);
  return { r: clamp(c.r + (t - c.r) * k), g: clamp(c.g + (t - c.g) * k), b: clamp(c.b + (t - c.b) * k) };
}
