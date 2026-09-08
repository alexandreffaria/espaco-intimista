#!/usr/bin/env node
/* ============================================================
   Intimista — the whole build.

   The site is plain static files: no framework, no dependencies.
   Everything is authored in src/; this script stitches it into
   dist/, which is the site exactly as the server sees it:

     src/index.html  + sections/*.html   ->  dist/index.html
     src/styles/*.css (index.css order)  ->  dist/css/site.css
     src/scripts/*.js (ES modules)       ->  dist/js/
     media/, font/, favicon.svg          ->  copied across

   Run it with `npm run build`, or `npm run dev` to rebuild on
   save and serve dist/ at http://localhost:4321.

   Nothing in dist/ is ever worth editing — it is thrown away and
   written again on the next save.
   ============================================================ */

import {
  readFileSync, writeFileSync, readdirSync, existsSync, statSync,
  mkdirSync, copyFileSync, rmSync, watch,
} from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, resolve, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'dist');

/* everything the page loads that isn't authored in src/ */
const ASSETS = ['media', 'font', 'favicon.svg'];

const read = (file) => readFileSync(file, 'utf8');
const short = (path) => relative(ROOT, path).split(sep).join('/');

/* every missing file should read as "who asked for what", not as a stack trace */
function readSource(path, askedBy) {
  if (existsSync(path)) return read(path);
  throw new Error(`${short(path)} does not exist${askedBy ? ` (asked for by ${short(askedBy)})` : ''}`);
}

/* ---------- html: <!-- include: sections/hero.html --> ---------- */

const INCLUDE = /^([ \t]*)<!--\s*include:\s*(\S+)\s*-->[ \t]*$/gm;

function renderHtml(file, trail = []) {
  const path = resolve(SRC, file);
  if (trail.includes(path)) throw new Error(`include loop: ${trail.concat(path).map(short).join(' -> ')}`);

  return readSource(path, trail.at(-1)).replace(INCLUDE, (_line, indent, target) => {
    const piece = renderHtml(target, trail.concat(path)).trimEnd();
    /* the piece keeps the indentation the include sat at, so the output
       still reads like one hand-written page */
    return piece.replace(/^(?!$)/gm, indent);
  });
}

/* ---------- css: @import 'tokens.css'; ---------- */

const IMPORT = /^@import\s+(?:url\()?['"]([^'"]+)['"]\)?\s*;[ \t]*$/gm;

function renderCss(file, trail = []) {
  const path = resolve(SRC, 'styles', file);
  if (trail.includes(path)) throw new Error(`import loop: ${trail.concat(path).map(short).join(' -> ')}`);

  /* a blank line around each file keeps the stylesheet readable */
  return readSource(path, trail.at(-1)).replace(IMPORT, (_line, target) =>
    `\n${renderCss(target, trail.concat(path)).trim()}\n`
  );
}

/* ---------- writing what changed ---------- */

function put(file, body) {
  const path = join(OUT, file);
  mkdirSync(dirname(path), { recursive: true });

  /* a CRLF checkout still counts as unchanged, so a fresh clone builds quietly */
  const changed = !existsSync(path) || read(path).replaceAll('\r\n', '\n') !== body;
  if (changed) writeFileSync(path, body);
  return changed;
}

/* copy an asset tree into dist/, skipping what is already there and
   removing what no longer exists. Returns how many files it touched. */
function mirror(name) {
  const from = join(ROOT, name);
  const to = join(OUT, name);
  if (!existsSync(from)) return 0;

  const source = statSync(from);
  if (source.isFile()) {
    const copy = existsSync(to) ? statSync(to) : null;
    const stale = !copy || copy.size !== source.size || copy.mtimeMs < source.mtimeMs;
    if (stale) copyFileSync(from, to);
    return stale ? 1 : 0;
  }

  mkdirSync(to, { recursive: true });
  const here = readdirSync(from);

  for (const gone of readdirSync(to).filter((file) => !here.includes(file))) {
    rmSync(join(to, gone), { recursive: true });
  }
  return here.reduce((n, file) => n + mirror(join(name, file)), 0);
}

function build() {
  const started = Date.now();
  const written = [];

  const html = renderHtml('index.html');
  if (put('index.html', html)) written.push('index.html');

  if (put('css/site.css', renderCss('index.css'))) written.push('css/site.css');

  /* the scripts ship as they are written: one ES module per behaviour */
  mkdirSync(join(OUT, 'js'), { recursive: true });
  const scripts = readdirSync(join(SRC, 'scripts')).filter((file) => file.endsWith('.js'));

  for (const stale of readdirSync(join(OUT, 'js')).filter((file) => !scripts.includes(file))) {
    rmSync(join(OUT, 'js', stale));
    written.push(`js/${stale} (removed)`);
  }
  for (const file of scripts) {
    if (put(`js/${file}`, read(join(SRC, 'scripts', file)))) written.push(`js/${file}`);
  }

  const copied = ASSETS.reduce((n, name) => n + mirror(name), 0);
  if (copied) written.push(`${copied} asset${copied > 1 ? 's' : ''}`);

  const ms = Date.now() - started;
  console.log(written.length ? `built in ${ms}ms: ${written.join(', ')}` : `nothing to do (${ms}ms)`);
}

/* ---------- dev: rebuild on save, serve dist/ ---------- */

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.ttf': 'font/ttf',
};

function serve(port = 4321) {
  createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const path = join(OUT, url.endsWith('/') ? `${url}index.html` : url);
    if (!path.startsWith(OUT)) return res.writeHead(403).end();

    try {
      res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
      res.end(readFileSync(path));
    } catch {
      res.writeHead(404).end(`not found: ${url}`);
    }
  }).listen(port, () => console.log(`serving http://localhost:${port}`));
}

function watchSrc() {
  let pending = null;

  watch(SRC, { recursive: true }, () => {
    /* editors save in bursts — wait for the dust to settle */
    clearTimeout(pending);
    pending = setTimeout(() => {
      try {
        build();
      } catch (err) {
        console.error(err.message);
      }
    }, 60);
  });

  console.log('watching src/');
}

try {
  build();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

if (process.argv.includes('--watch')) watchSrc();
if (process.argv.includes('--serve')) serve();
