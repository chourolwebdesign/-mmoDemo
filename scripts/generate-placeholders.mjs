import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const LISTINGS_DIR = path.join(ROOT, "public/images/listings");
const SITE_DIR = path.join(ROOT, "public/images/site");

const INK = "#171b21";
const BRASS = "#a3823f";

const PALETTES = [
  ["#efece4", "#d9d2c0"],
  ["#e9dfc9", "#cdb98a"],
  ["#e3ded2", "#c3b9a1"],
  ["#e6e9e2", "#c6cdbf"],
  ["#ece5db", "#cbbfa8"],
  ["#e2e4e6", "#bfc6cb"],
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Icon fragments, drawn centered around (0,0) at roughly 220x160 scale.
const ICONS = {
  exterior: `
    <g transform="translate(-110,-90)" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55">
      <path d="M10 90 L110 20 L210 90" />
      <rect x="30" y="90" width="160" height="90" />
      <rect x="95" y="130" width="30" height="50" />
      <rect x="50" y="105" width="26" height="26" />
      <rect x="144" y="105" width="26" height="26" />
    </g>`,
  interior: `
    <g transform="translate(-110,-80)" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55">
      <rect x="10" y="10" width="200" height="140" />
      <rect x="34" y="34" width="70" height="70" />
      <line x1="69" y1="34" x2="69" y2="104" />
      <line x1="34" y1="69" x2="104" y2="69" />
      <path d="M130 150 L130 100 L200 100" />
      <line x1="10" y1="150" x2="210" y2="150" />
    </g>`,
  outdoor: `
    <g transform="translate(-110,-70)" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55">
      <line x1="0" y1="120" x2="220" y2="120" />
      <path d="M40 120 C40 90 60 90 60 120" />
      <line x1="50" y1="120" x2="50" y2="70" />
      <circle cx="50" cy="55" r="22" />
      <path d="M120 120 L150 60 L180 120 Z" />
    </g>`,
  plan: `
    <g transform="translate(-110,-80)" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55">
      <rect x="10" y="10" width="200" height="140" stroke-dasharray="6 6" />
      <line x1="10" y1="80" x2="120" y2="80" />
      <line x1="120" y1="10" x2="120" y2="150" />
    </g>`,
};

function svgPlaceholder({ label, index, width = 1600, height = 1067, icon = "exterior" }) {
  const [c1, c2] = PALETTES[hash(label + index) % PALETTES.length];
  const iconMarkup = ICONS[icon] ?? ICONS.exterior;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}" />
      <stop offset="1" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
  <g transform="translate(${width / 2},${height / 2 - 40}) scale(${width / 420})">
    ${iconMarkup}
  </g>
  <text x="50%" y="${height - 88}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(width / 46)}" fill="${INK}" opacity="0.62">${escapeXml(label)}</text>
  <text x="50%" y="${height - 48}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(width / 100)}" letter-spacing="4" fill="${BRASS}">MUSTERFOTO &#183; PLATZHALTERBILD</text>
</svg>`;
}

const listings = [
  {
    slug: "wiesbaden-sonnenberg-villa",
    images: [
      { label: "Straßenansicht, Wiesbaden-Sonnenberg", icon: "exterior" },
      { label: "Wohnzimmer mit Kamin, Erdgeschoss", icon: "interior" },
      { label: "Offene Wohnküche mit Einbauküche", icon: "interior" },
      { label: "Terrasse und Garten, Südwestausrichtung", icon: "outdoor" },
      { label: "Schlafzimmer im Obergeschoss", icon: "interior" },
    ],
  },
  {
    slug: "wiesbaden-biebrich-eigentumswohnung",
    images: [
      { label: "Wohnzimmer mit Blick zum Balkon", icon: "interior" },
      { label: "Offene Küche im Wohnbereich", icon: "interior" },
      { label: "Schlafzimmer mit Blick ins Grüne", icon: "interior" },
      { label: "Außenansicht, Wiesbaden-Biebrich", icon: "exterior" },
    ],
  },
  {
    slug: "mainz-altstadt-altbauwohnung",
    images: [
      { label: "Fassade des Altbaus, Mainzer Altstadt", icon: "exterior" },
      { label: "Wohnzimmer mit Stuckdecke und Dielenboden", icon: "interior" },
      { label: "Sanierte Einbauküche", icon: "interior" },
    ],
  },
  {
    slug: "taunusstein-baugrundstueck",
    images: [
      { label: "Baugrundstück in Taunusstein-Wehen", icon: "plan" },
      { label: "Blick über das Grundstück Richtung Wald", icon: "outdoor" },
    ],
  },
  {
    slug: "wiesbaden-zentrum-praxisflaeche",
    images: [
      { label: "Büro-/Praxisfläche mit Empfangsbereich", icon: "interior" },
      { label: "Konferenzraum der Gewerbefläche", icon: "interior" },
      { label: "Fassade im Zentrum von Wiesbaden", icon: "exterior" },
    ],
  },
  {
    slug: "eltville-villa",
    images: [
      { label: "Außenansicht der Villa mit Weinbergblick", icon: "exterior" },
      { label: "Wohnbereich mit großzügiger Fensterfront", icon: "interior" },
      { label: "Pool und Terrasse im Garten", icon: "outdoor" },
      { label: "Ansicht des Anwesens von der Zufahrt", icon: "exterior" },
    ],
  },
  {
    slug: "wiesbaden-dotzheim-doppelhaushaelfte",
    images: [{ label: "Außenansicht, Wiesbaden-Dotzheim", icon: "exterior" }],
  },
  {
    slug: "ruedesheim-renditeobjekt",
    images: [
      { label: "Fassade des Mehrfamilienhauses, Rüdesheim", icon: "exterior" },
      { label: "Treppenhaus des Mehrfamilienhauses", icon: "interior" },
      { label: "Beispielwohnung im Mehrfamilienhaus", icon: "interior" },
    ],
  },
];

async function main() {
  for (const listing of listings) {
    const dir = path.join(LISTINGS_DIR, listing.slug);
    await mkdir(dir, { recursive: true });
    for (const [i, img] of listing.images.entries()) {
      const svg = svgPlaceholder({ label: img.label, index: i, icon: img.icon });
      await writeFile(path.join(dir, `${i + 1}.svg`), svg, "utf-8");
    }
    console.log(`✓ ${listing.slug}: ${listing.images.length} Platzhalterbilder`);
  }

  await mkdir(SITE_DIR, { recursive: true });

  const heroSvg = svgPlaceholder({
    label: "Immobilien für Wiesbaden und den Rheingau",
    index: 0,
    width: 2000,
    height: 1500,
    icon: "exterior",
  });
  await writeFile(path.join(SITE_DIR, "hero.svg"), heroSvg, "utf-8");

  const verkaufenSvg = svgPlaceholder({
    label: "Ihre Immobilie verdient den besten Preis",
    index: 1,
    width: 2000,
    height: 1200,
    icon: "interior",
  });
  await writeFile(path.join(SITE_DIR, "verkaufen-hero.svg"), verkaufenSvg, "utf-8");

  const ogSvg = svgPlaceholder({
    label: "Fischer Immobilien — Wiesbaden & Rheingau",
    index: 2,
    width: 1200,
    height: 630,
    icon: "exterior",
  });
  await sharp(Buffer.from(ogSvg)).png().toFile(path.join(SITE_DIR, "og-image.png"));

  console.log("✓ site: hero.svg, verkaufen-hero.svg, og-image.png");
}

main();
