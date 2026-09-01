#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';

const args = process.argv.slice(2);

function getArg(flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return null;
}

const packArg = getArg('--pack') || getArg('-p') || 'lucide';
const outputDir = getArg('--output') || getArg('-o') || './downloaded_svgs';
const limitArg = parseInt(getArg('--limit') || '20', 10);

console.log(`[*] Fetching icon pack: '${packArg}'...`);

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const catalogJson = await fetchUrl(`https://api.iconify.design/collection?prefix=${packArg}`);
    const catalog = JSON.parse(catalogJson);

    let names = catalog.uncategorized || [];
    if (catalog.categories) {
      Object.values(catalog.categories).forEach(arr => names.push(...arr));
    }
    names = Array.from(new Set(names)).slice(0, limitArg);

    console.log(`[*] Downloading ${names.length} icons into '${outputDir}'...`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const pathsMap = {};

    for (const name of names) {
      const svgUrl = `https://i.allsvgicons.com/${packArg}/${name}.svg`;
      try {
        const svgContent = await fetchUrl(svgUrl);
        fs.writeFileSync(path.join(outputDir, `${name}.svg`), svgContent);
        const matches = svgContent.match(/d="([^"]+)"/g) || [];
        pathsMap[name] = matches.map(m => m.replace(/d="|"/g, ''));
        console.log(` [+] Downloaded: ${name}.svg`);
      } catch (err) {
        console.error(` [!] Error downloading ${name}: ${err.message}`);
      }
    }

    fs.writeFileSync(path.join(outputDir, '_paths.json'), JSON.stringify(pathsMap, null, 2));
    console.log(`\n[+] Done! SVGs and path data saved in '${outputDir}'.`);

  } catch (err) {
    console.error(`[!] Failed: ${err.message}`);
  }
}

run();
