#!/usr/bin/env node
/**
 * Ink Kinetic PPT — Single-File Portable HTML Bundler
 * Packs index.html, CSS presets/styles, local images (Base64 data URI), vendor GSAP & engine.js
 * into one standalone offline-playable .html file (double-click anywhere, zero HTTP server required).
 *
 * Usage:
 *   node scripts/bundle-standalone.mjs [--src <deckDir>] [--out <outputFile.html>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { resolveDeckFile } from './deck-file.mjs';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--src' && argv[i + 1]) args.src = argv[++i];
    else if (argv[i] === '--out' && argv[i + 1]) args.out = argv[++i];
  }
  return args;
}

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const { src, out } = parseArgs(process.argv.slice(2));
const srcDir = path.resolve(src || process.cwd());
const root = fs.realpathSync.native(srcDir);
const indexPath = resolveDeckFile(root, 'index.html');
if (!indexPath) {
  console.error(`Error: index.html not found in ${srcDir}`);
  process.exit(1);
}

const outPath = path.resolve(out || path.join(srcDir, `${path.basename(srcDir)}-portable.html`));
let html = fs.readFileSync(indexPath, 'utf8');

function localResource(reference) {
  if (/^(?:(?:https?:)?\/\/|data:|#)/i.test(reference)) return null;
  const resource = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  return resolveDeckFile(root, resource);
}

// 1. Inline local <link rel="stylesheet" href="...">
html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["']\s*\/?>/gi, (full, href) => {
  const cssPath = localResource(href);
  if (!cssPath) return full;
  const css = fs.readFileSync(cssPath, 'utf8');
  return `<style data-inlined="${href}">\n${css}\n</style>`;
});

// 2. Inline local <img src="..."> (supports data URIs and external URLs cleanly)
html = html.replace(/(<img\b[^>]*\ssrc=["'])([^"']+)(["'][^>]*>)/gi, (full, pre, srcRel, post) => {
  const imgPath = localResource(srcRel);
  if (!imgPath) return full;
  const ext = path.extname(imgPath).toLowerCase();
  const mime = MIME_MAP[ext] || 'application/octet-stream';
  const b64 = fs.readFileSync(imgPath).toString('base64');
  return `${pre}data:${mime};base64,${b64}${post}`;
});

// 3. Inline local <script src="..."></script>
html = html.replace(/<script\s+src=["']([^"']+)["']\s*>\s*<\/script>/gi, (full, srcRel) => {
  const jsPath = localResource(srcRel);
  if (!jsPath) return full;
  const js = fs.readFileSync(jsPath, 'utf8').replace(/<\/script>/gi, '<\\/script>');
  return `<script data-inlined="${srcRel}">\n${js}\n</script>`;
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, 'utf8');
const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`Bundled standalone portable HTML (${kb} KB): ${outPath}`);
