import { mkdir, writeFile } from 'node:fs/promises';
import { extractBrand } from './brand/extract.js';
import { generateDemoSite } from './site/generate.js';

const HELP = `
collage-maxxing — prospect -> brand -> personalised demo site

  npm run brand -- <url>            print the extracted brand profile as JSON
  npm run demo  -- <url> [outfile]  extract, then write a demo site (default: out/<host>.html)
  npm run check                     run the self-check

Options for demo:
  --sender <name>   who built it        (default: Optimized Aminos)
  --cta <url>       booking link        (default: https://example.com/book)
  --offer <text>    the pitch headline  (default: reimagined)
`;

const slug = (u: string) => new URL(u).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-');

function flag(argv: string[], name: string, fallback: string): string {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1]! : fallback;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const positional = rest.filter((a, i) => !a.startsWith('--') && !rest[i - 1]?.startsWith('--'));
  const url = positional[0];

  if (!cmd || cmd === 'help' || !url) {
    console.log(HELP);
    process.exit(cmd && cmd !== 'help' ? 1 : 0);
  }

  const profile = await extractBrand(url);

  if (cmd === 'brand') {
    console.log(JSON.stringify(profile, null, 2));
    return;
  }

  if (cmd === 'demo' || cmd === 'run') {
    const html = generateDemoSite(profile, {
      senderName: flag(rest, 'sender', 'Optimized Aminos'),
      ctaUrl: flag(rest, 'cta', 'https://example.com/book'),
      offer: flag(rest, 'offer', 'reimagined'),
    });
    const out = positional[1] ?? `out/${slug(profile.url)}.html`;
    await mkdir(new URL('.', `file:///${out.replace(/\\/g, '/')}`).pathname.slice(1), { recursive: true }).catch(() => {});
    await writeFile(out, html, 'utf8');

    console.log(`brand   : ${profile.identity.name}`);
    console.log(`palette : ${profile.palette.primary} / ${profile.palette.secondary} / ${profile.palette.accent}`);
    console.log(`type    : ${profile.type.heading} + ${profile.type.body}`);
    console.log(`sections: ${profile.services.join(', ') || '(none found)'}`);
    if (profile.warnings.length) console.log(`warnings: ${profile.warnings.join(' ; ')}`);
    console.log(`written : ${out}  (${(html.length / 1024).toFixed(1)} kB)`);
    return;
  }

  console.log(HELP);
  process.exit(1);
}

main().catch((err) => {
  console.error(`failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
