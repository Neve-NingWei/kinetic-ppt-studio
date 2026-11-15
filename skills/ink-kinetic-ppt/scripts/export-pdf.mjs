#!/usr/bin/env node
/**
 * Ink Kinetic PPT — 16:9 High-Res Static Archive PDF Exporter
 * Note: Standard PDF files are static print/document containers and cannot execute
 * custom Canvas/SVG/GSAP kinetic transitions. Pair with bundle-standalone.mjs for interactive motion.
 *
 * Usage:
 *   node scripts/export-pdf.mjs [--src <deckDir>] [--out <outputFile.pdf>]
 *     [--theme <name>] [--chrome <executable>] [--playwright <moduleFile>]
 */
import { once } from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveDeckFile } from './deck-file.mjs';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--src' && argv[i + 1]) args.src = argv[++i];
    else if (argv[i] === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (argv[i] === '--chrome' && argv[i + 1]) args.chrome = argv[++i];
    else if (argv[i] === '--playwright' && argv[i + 1]) args.playwright = argv[++i];
    else if (argv[i] === '--theme' && argv[i + 1]) args.theme = argv[++i];
  }
  return args;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const args = parseArgs(process.argv.slice(2));
const srcDir = path.resolve(args.src || process.cwd());
const outPath = path.resolve(args.out || path.join(srcDir, `${path.basename(srcDir)}.pdf`));
const root = fs.realpathSync.native(srcDir);
if (!resolveDeckFile(root, 'index.html')) {
  throw new Error(`index.html not found in ${srcDir}`);
}

async function loadPlaywright() {
  const overrides = [args.playwright, process.env.PLAYWRIGHT_PATH].filter(Boolean).map(mod => {
    const isFilePath = path.isAbsolute(mod) || /^\.{1,2}[\\/]/.test(mod) || fs.existsSync(mod);
    return isFilePath ? pathToFileURL(path.resolve(mod)).href : mod;
  });

  for (const mod of [...overrides, 'playwright', 'playwright-core']) {
    try {
      const loaded = await import(mod);
      if (loaded.chromium) return loaded.chromium;
    } catch {
      // Try next candidate
    }
  }
  throw new Error('Install Playwright or pass --playwright <moduleFile>.');
}

const chromium = await loadPlaywright();
const chrome = args.chrome || process.env.CHROME_PATH;
const outputDir = path.dirname(outPath);
fs.mkdirSync(outputDir, { recursive: true });
const safeTmp = fs.mkdtempSync(path.join(fs.realpathSync.native(outputDir), '.tmp-pdf-'));
const tempPdf = path.join(safeTmp, 'export.pdf');

const server = http.createServer((req, res) => {
  if (req.headers.host !== '127.0.0.1:' + server.address().port) {
    res.writeHead(403).end();
    return;
  }

  const [urlPath] = (req.url || '/').split('?', 1);
  let reference;
  try {
    if (!urlPath.startsWith('/')) throw new Error('Expected a URL path.');
    reference = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath.slice(1));
  } catch {
    res.writeHead(400).end();
    return;
  }

  let file;
  try {
    file = resolveDeckFile(root, reference);
  } catch {
    res.writeHead(404).end();
    return;
  }
  if (!file || path.relative(root, file).split(path.sep).some(part => /^\.tmp-pdf(?:-|$)/i.test(part))) {
    res.writeHead(404).end();
    return;
  }

  res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  const stream = fs.createReadStream(file);
  res.once('close', () => stream.destroy());
  stream.on('error', () => {
    if (res.headersSent) res.destroy();
    else res.writeHead(404).end();
  });
  stream.pipe(res);
});

let browser;
try {
  process.env.TEMP = safeTmp;
  process.env.TMP = safeTmp;
  process.env.TMPDIR = safeTmp;

  await once(server.listen(0, '127.0.0.1'), 'listening');
  const { port } = server.address();
  browser = await chromium.launch({
    ...(chrome ? { executablePath: path.resolve(chrome) } : {}),
    headless: true,
    args: ['--no-first-run', '--disable-gpu-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const themeQuery = args.theme ? `?theme=${encodeURIComponent(args.theme)}` : '';
  await page.goto(`http://127.0.0.1:${port}/${themeQuery}`, { waitUntil: 'load', timeout: 15000 });
  await page.evaluate(async () => {
    await document.fonts?.ready;
    document.body.classList.add('hud-hidden');
  });
  await page.waitForTimeout(300);

  // Convert slides into clean stacked 1600x900 print pages without HUD/canvas clutter
  const slideCount = await page.evaluate(() => {
    if (window.gsap) {
      window.gsap.globalTimeline.kill();
    }
    const style = document.createElement('style');
    style.textContent = `
      @page { size: 1600px 900px; margin: 0; }
      html, body, #stage, #slides-root {
        width: 1600px !important;
        height: auto !important;
        overflow: visible !important;
        position: static !important;
      }
      #deck-hud, #fx-canvas, #burn-mask-svg, #transition-host {
        display: none !important;
      }
      .slide {
        position: relative !important;
        inset: auto !important;
        width: 1600px !important;
        height: 900px !important;
        visibility: visible !important;
        opacity: 1 !important;
        page-break-after: always !important;
        break-after: page !important;
        overflow: hidden !important;
      }
      .slide:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .anim-split, .anim-split *, .anim-rise {
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
      }
      .draw-line {
        stroke-dashoffset: 0 !important;
        stroke-dasharray: none !important;
      }
    `;
    document.head.appendChild(style);
    return document.querySelectorAll('#slides-root > .slide').length;
  });

  await page.waitForTimeout(200);
  await page.pdf({
    path: tempPdf,
    width: '1600px',
    height: '900px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  fs.renameSync(tempPdf, outPath);

  const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Exported ${slideCount}-slide 16:9 static archive PDF (${kb} KB): ${outPath}`);
} finally {
  try {
    await browser?.close();
  } finally {
    try {
      if (server.listening) {
        await new Promise(resolve => {
          server.close(resolve);
          server.closeAllConnections?.();
        });
      }
    } finally {
      fs.rmSync(safeTmp, { recursive: true, force: true, maxRetries: 3 });
    }
  }
}
