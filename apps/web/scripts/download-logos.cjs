#!/usr/bin/env node

/**
 * Script to download car brand logos from the car-logos-dataset
 * https://github.com/filippofilip95/car-logos-dataset
 *
 * Usage: node download-logos.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const LOGO_BASE_URL = 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'logos');

// Brand slugs to download (from carBrands.ts)
const BRAND_SLUGS = [
  'acura',
  'alfa-romeo',
  'aston-martin',
  'audi',
  'bentley',
  'bmw',
  'bugatti',
  'buick',
  'cadillac',
  'chevrolet',
  'chrysler',
  'citroen',
  'dacia',
  'daihatsu',
  'dmc',
  'dodge',
  'ferrari',
  'fiat',
  'ford',
  'genesis',
  'gmc',
  'honda',
  'hummer',
  'hyundai',
  'infiniti',
  'isuzu',
  'jaguar',
  'jeep',
  'kia',
  'koenigsegg',
  'lada',
  'lamborghini',
  'lancia',
  'land-rover',
  'lexus',
  'lincoln',
  'lotus',
  'maserati',
  'maybach',
  'mazda',
  'mclaren',
  'mercedes-benz',
  'mini',
  'mitsubishi',
  'nissan',
  'oldsmobile',
  'opel',
  'pagani',
  'peugeot',
  'plymouth',
  'polestar',
  'pontiac',
  'porsche',
  'ram',
  'renault',
  'rivian',
  'rolls-royce',
  'saab',
  'saturn',
  'seat',
  'skoda',
  'smart',
  'subaru',
  'suzuki',
  'tesla',
  'toyota',
  'volkswagen',
  'volvo',
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Download a single logo
function downloadLogo(slug) {
  return new Promise((resolve, reject) => {
    const url = `${LOGO_BASE_URL}/${slug}.png`;
    const outputPath = path.join(OUTPUT_DIR, `${slug}.png`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`✓ ${slug}.png (already exists)`);
      resolve();
      return;
    }

    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✓ ${slug}.png`);
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlink(outputPath, () => {});
          console.error(`✗ ${slug}.png - ${err.message}`);
          reject(err);
        });
      } else if (response.statusCode === 404) {
        console.warn(`⚠ ${slug}.png - Not found (404)`);
        resolve(); // Don't fail, just warn
      } else {
        console.error(`✗ ${slug}.png - HTTP ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      console.error(`✗ ${slug}.png - ${err.message}`);
      reject(err);
    });
  });
}

// Download all logos with rate limiting
async function downloadAll() {
  console.log(`Downloading ${BRAND_SLUGS.length} car brand logos...\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const slug of BRAND_SLUGS) {
    try {
      const outputPath = path.join(OUTPUT_DIR, `${slug}.png`);
      if (fs.existsSync(outputPath)) {
        skipped++;
      } else {
        succeeded++;
      }
      await downloadLogo(slug);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      failed++;
    }
  }

  console.log(`\n✅ Download complete!`);
  console.log(`   ${succeeded} downloaded`);
  console.log(`   ${skipped} already existed`);
  if (failed > 0) {
    console.log(`   ${failed} failed`);
  }
  console.log(`\nLogos saved to: ${OUTPUT_DIR}`);
}

downloadAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
