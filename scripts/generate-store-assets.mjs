#!/usr/bin/env node
/**
 * Play / App Store marketing bitmaps from resources/icon.png.
 * Screenshots still need a device capture into store/assets/screenshots/.
 */
import sharp from "sharp";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const iconSrc = join(root, "resources/icon.png");
const outDir = join(root, "store/assets");
const navy = { r: 10, g: 25, b: 47, alpha: 1 };
const cyan = { r: 0, g: 240, b: 255, alpha: 1 };

async function solidIcon(size, out) {
  const logo = Math.round(size * 0.78);
  const fg = await sharp(iconSrc)
    .resize(logo, logo, { fit: "contain", background: navy })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: navy } })
    .composite([{ input: fg, gravity: "centre" }])
    .removeAlpha()
    .png()
    .toFile(out);
}

async function featureGraphic(out) {
  const w = 1024;
  const h = 500;
  const logo = 220;
  const fg = await sharp(iconSrc)
    .resize(logo, logo, { fit: "contain", background: navy })
    .png()
    .toBuffer();

  // Wordmark as SVG overlay — keeps the graphic brand-led without a font file.
  const wordmark = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="160">
  <text x="0" y="72" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="rgb(0,240,255)">THALVO</text>
  <text x="0" y="122" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="rgb(245,185,66)">MarineOS</text>
</svg>`);

  const bar = await sharp({
    create: { width: w, height: 4, channels: 4, background: cyan },
  })
    .png()
    .toBuffer();

  await sharp({ create: { width: w, height: h, channels: 4, background: navy } })
    .composite([
      { input: fg, left: 72, top: Math.round((h - logo) / 2) },
      { input: wordmark, left: 340, top: 170 },
      { input: bar, left: 0, top: h - 4 },
    ])
    .png()
    .toFile(out);
}

async function main() {
  if (!existsSync(iconSrc)) {
    console.error("[store-assets] missing resources/icon.png");
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, "screenshots"), { recursive: true });
  await solidIcon(512, join(outDir, "icon-512.png"));
  await solidIcon(1024, join(outDir, "icon-1024.png"));
  await featureGraphic(join(outDir, "feature-graphic.png"));
  writeFileSync(
    join(outDir, "screenshots/README.md"),
    `# Screenshots

Capture from a real device or simulator after \`npm run build:mobile\`.

## Apple (required)

The app runs on iPhone and iPad. PNG or JPEG, no transparency.

- iPhone with Dynamic Island (medium): **1179×2556** or **1206×2622** — chart, cockpit, sign-in
- iPad 13-inch: **2064×2752** or **2048×2732** — same frames

## Google Play

- Phone: 16:9 or 9:16, min 320px, max 3840px on a side — at least 2 frames

Do not overlay promo stickers on hero frames. Prefer the live chart and cockpit UI.
`,
  );
  console.log("[store-assets] icon-512, icon-1024, feature-graphic ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
