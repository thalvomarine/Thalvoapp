#!/usr/bin/env node
/**
 * Branded MarineOS splash + launcher icons for Capacitor shells.
 * Prefer this over `@capacitor/assets generate` — that tool rewrites the
 * PWA manifest and expects a complete iOS AppIcon catalog that we do not
 * keep in the repo.
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const iconSrc = join(root, "resources/icon.png");
const navy = { r: 10, g: 25, b: 47, alpha: 1 };

async function solidIcon(size, out) {
  const logo = Math.round(size * 0.78);
  const fg = await sharp(iconSrc)
    .resize(logo, logo, { fit: "contain", background: navy })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: navy } })
    .composite([{ input: fg, gravity: "centre" }])
    .png()
    .toFile(out);
}

async function splashPortrait(w, h, out, logoFrac = 0.36) {
  const logo = Math.round(Math.min(w, h) * logoFrac);
  const fg = await sharp(iconSrc)
    .resize(logo, logo, { fit: "contain", background: navy })
    .png()
    .toBuffer();
  await sharp({ create: { width: w, height: h, channels: 4, background: navy } })
    .composite([{ input: fg, gravity: "centre" }])
    .png()
    .toFile(out);
}

async function main() {
  if (!existsSync(iconSrc)) {
    console.error("[native-assets] missing resources/icon.png");
    process.exit(1);
  }

  // Source splash for tooling / docs.
  await splashPortrait(2732, 2732, join(root, "resources/splash.png"), 0.34);
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: navy } })
    .png()
    .toFile(join(root, "resources/icon-background.png"));
  const fgIcon = await sharp(iconSrc)
    .resize(768, 768, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: fgIcon, gravity: "centre" }])
    .png()
    .toFile(join(root, "resources/icon-foreground.png"));

  const iosIconDir = join(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset");
  const iosIcons = {
    "carol.w@example.org": 40,
    "ivan.p@example.net": 60,
    "grace.l@example.com": 58,
    "aaron.s@example.org": 87,
    "ivan.p@example.net": 80,
    "victor.l@example.com": 120,
    "victor.l@example.com": 120,
    "tina.r@example.net": 180,
    "AppIcon-20.png": 20,
    "AppIcon-20@2x.png": 40,
    "AppIcon-29.png": 29,
    "AppIcon-29@2x.png": 58,
    "AppIcon-40.png": 40,
    "AppIcon-40@2x.png": 80,
    "AppIcon-76.png": 76,
    "AppIcon-76@2x.png": 152,
    "AppIcon-83.5@2x.png": 167,
    "AppIcon-512@2x.png": 1024,
  };
  for (const [name, size] of Object.entries(iosIcons)) {
    await solidIcon(size, join(iosIconDir, name));
  }

  const iosSplashDir = join(root, "ios/App/App/Assets.xcassets/Splash.imageset");
  mkdirSync(iosSplashDir, { recursive: true });
  for (const f of readdirSync(iosSplashDir)) {
    if (/splash-2732|white|-dark\.png$/i.test(f) || /Default@1x/i.test(f)) {
      unlinkSync(join(iosSplashDir, f));
    }
  }
  await splashPortrait(2732, 2732, join(iosSplashDir, "Default@2x~universal~anyany.png"), 0.34);
  await splashPortrait(2732, 2732, join(iosSplashDir, "Default@2x~universal~comany.png"), 0.34);
  await splashPortrait(2732, 2732, join(iosSplashDir, "Default@3x~universal~anyany.png"), 0.34);
  writeFileSync(
    join(iosSplashDir, "Contents.json"),
    JSON.stringify(
      {
        images: [
          { idiom: "universal", filename: "Default@2x~universal~anyany.png", scale: "2x" },
          {
            idiom: "universal",
            filename: "Default@2x~universal~comany.png",
            scale: "2x",
            "width-class": "compact",
          },
          { idiom: "universal", filename: "Default@3x~universal~anyany.png", scale: "3x" },
        ],
        info: { version: 1, author: "thalvo" },
      },
      null,
      2,
    ),
  );

  await splashPortrait(1280, 1920, join(root, "android/app/src/main/res/drawable/splash.png"), 0.34);
  const dens = {
    "drawable-land-hdpi": [800, 480],
    "drawable-land-mdpi": [480, 320],
    "drawable-land-xhdpi": [1280, 720],
    "drawable-land-xxhdpi": [1600, 960],
    "drawable-land-xxxhdpi": [1920, 1280],
    "drawable-port-hdpi": [480, 800],
    "drawable-port-mdpi": [320, 480],
    "drawable-port-xhdpi": [720, 1280],
    "drawable-port-xxhdpi": [960, 1600],
    "drawable-port-xxxhdpi": [1280, 1920],
  };
  for (const [folder, [w, h]] of Object.entries(dens)) {
    const dir = join(root, "android/app/src/main/res", folder);
    mkdirSync(dir, { recursive: true });
    await splashPortrait(w, h, join(dir, "splash.png"), 0.34);
  }

  const mips = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
  };
  for (const [folder, size] of Object.entries(mips)) {
    const dir = join(root, "android/app/src/main/res", folder);
    mkdirSync(dir, { recursive: true });
    await solidIcon(size, join(dir, "ic_launcher.png"));
    await solidIcon(size, join(dir, "ic_launcher_round.png"));
    await solidIcon(size, join(dir, "ic_launcher_foreground.png"));
  }

  console.log("[native-assets] MarineOS splash + launcher icons ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
