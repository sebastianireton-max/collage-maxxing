/** A colour that survived scoring, kept with its evidence so the UI can explain itself. */
export interface BrandColor {
  hex: string;
  /** How many times it appeared across all stylesheets. */
  hits: number;
  /** True when it came from a CSS custom property (--brand, --primary, ...). */
  declared: boolean;
  /** The custom-property name, when there was one. */
  token?: string;
}

export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
  paper: string;
  /** Everything that scored, ranked. Kept so a human can override the pick. */
  candidates: BrandColor[];
}

export interface BrandType {
  heading: string;
  body: string;
  /** Google Fonts families seen in <link> tags — the strongest available signal. */
  googleFonts: string[];
}

export interface BrandIdentity {
  name: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
}

export interface BrandContact {
  phone?: string;
  email?: string;
  address?: string;
  socials: Record<string, string>;
}

export interface BrandProfile {
  url: string;
  fetchedAt: string;
  identity: BrandIdentity;
  palette: BrandPalette;
  type: BrandType;
  contact: BrandContact;
  /** Nav labels, de-noised — the closest thing a site gives you to a service list. */
  services: string[];
  /** Representative sentences, used to mirror their voice in the demo and the email. */
  voiceSample: string[];
  /** Non-fatal problems. Never throw on a bad prospect site; record and continue. */
  warnings: string[];
}
