#!/usr/bin/env node
/* ═══════════════════════════════════════════════════
   EURO POLO · scripts/fetch-shopee-images.js
   Download the product images still hotlinked from the Shopee CDN into the
   repo, at the exact paths docs/missing-images.md expects.

   Usage:
     node scripts/fetch-shopee-images.js              (download everything)
     node scripts/fetch-shopee-images.js --limit 5    (smoke test, first 5 URLs)
     node scripts/fetch-shopee-images.js --dry-run    (parse + plan only)

   Then wire the references up:
     node scripts/migrate-images.js --apply

   HOW IT BEHAVES
   ──────────────
   · Source of truth is docs/missing-images.md — it downloads nothing that is
     not already referenced by our own catalogue.
   · Resumable. A target that already exists on disk is skipped, so re-running
     after a partial run only fetches what is still missing.
   · Deduplicated. Several SKUs share one photograph; each distinct URL is
     fetched once and copied to every target path that wants it.
   · Collision-safe. Some products bundle several model numbers into one
     folder (e.g. wallets/ewb-40157-40158-40159-40160), and the filename
     convention in migrate-images.js reduces a SKU to its last token — so
     "EWB 40157 A" and "EWB 40158 A" both want "<folder>-a.jpg" while being
     four DIFFERENT photographs. Writing one file there would silently show
     the wrong colour on three of the four variants. Those URLs are instead
     saved under a SKU-qualified name and registered in data/_image-check.json,
     which migrate-images.js consults by URL *before* falling back to the
     convention. One file per distinct photograph, wired by provenance.
   · Verified. A response is only written if it is non-empty AND begins with
     the magic bytes of a real image. An HTML error page is discarded and the
     row is marked failed, so a bad fetch can never overwrite a good file.
   · Throttled ~300ms between network requests, 3 retries with backoff.

   Writes docs/still-missing-images.md (rows that failed) and
   data/_shopee-fetch-report.json.
═══════════════════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const WORKLIST  = path.join(ROOT, 'docs', 'missing-images.md');
const OUT_MD    = path.join(ROOT, 'docs', 'still-missing-images.md');
const OUT_JSON  = path.join(ROOT, 'data', '_shopee-fetch-report.json');
const CHECK     = path.join(ROOT, 'data', '_image-check.json');

const DRY_RUN   = process.argv.includes('--dry-run');
const LIMIT     = (() => {
  const i = process.argv.indexOf('--limit');
  return i > -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

const THROTTLE_MS   = 300;
const MAX_ATTEMPTS  = 3;
const TIMEOUT_MS    = 30_000;

/* A normal browser identity. Shopee's CDN serves hotlinked files fine, but a
   bare Node user-agent is the sort of thing rate-limiters single out. */
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Referer': 'https://shopee.com.my/',
  'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── worklist ─────────────────────────────────────── */

/* Rows look like:
   | EP0001 | EBA51208SB | variant | `product.html?id=EP0001` | `images/...jpg` | https://... |
   The summary table at the top has 3 columns, so require exactly 6 and a URL. */
function parseWorklist() {
  const text = fs.readFileSync(WORKLIST, 'utf8');
  let category = null;
  const rows = [];

  for (const line of text.split(/\r?\n/)) {
    const head = line.match(/^##\s+(bags|wallets|belts|luggage)\b/i);
    if (head) { category = head[1].toLowerCase(); continue; }
    if (!line.startsWith('|') || !line.includes('cf.shopee.com.my')) continue;

    const cells = line.split('|').slice(1, -1).map(c => c.trim().replace(/^`|`$/g, ''));
    if (cells.length !== 6) continue;

    const [product, sku, slot, page, localPath, url] = cells;
    if (!/^https?:\/\//.test(url)) continue;
    rows.push({ product, sku, slot, page, localPath, url, category });
  }
  return rows;
}

/* ── verification ─────────────────────────────────── */

/* Magic bytes, not content-type: the CDN is the thing we do not trust here.
   An HTML error body must never land on disk under a .jpg name. */
function imageFormat(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)            return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP')                 return 'webp';
  if (buf.subarray(0, 6).toString('ascii').startsWith('GIF8'))          return 'gif';
  if (buf.subarray(4, 12).toString('ascii') === 'ftypavif')             return 'avif';
  return null;
}

/* ── download ─────────────────────────────────────── */

async function fetchOnce(url) {
  const res = await fetch(url, {
    headers: HEADERS,
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('empty response body');

  const format = imageFormat(buf);
  if (!format) {
    const head = buf.subarray(0, 60).toString('utf8').replace(/\s+/g, ' ').trim();
    throw new Error(`not an image (${buf.length}B, starts "${head}")`);
  }
  return { buf, format };
}

async function download(url) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchOnce(url);
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS) {
        const backoff = 1000 * 2 ** (attempt - 1);   // 1s, 2s
        console.log(`    retry ${attempt}/${MAX_ATTEMPTS - 1} in ${backoff}ms — ${err.message}`);
        await sleep(backoff);
      }
    }
  }
  throw lastErr;
}

/* ── still-missing worklist ───────────────────────── */

function writeStillMissing(failed) {
  const byCat = new Map();
  for (const r of failed) {
    const c = r.category || 'uncategorised';
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c).push(r);
  }
  const order = ['bags', 'wallets', 'belts', 'luggage']
    .filter(c => byCat.has(c))
    .concat([...byCat.keys()].filter(c => !['bags','wallets','belts','luggage'].includes(c)));

  const L = [];
  L.push('# Still-missing product images — manual worklist');
  L.push('');
  L.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/fetch-shopee-images.js\`.`);
  L.push('');
  if (!failed.length) {
    L.push('**Nothing left.** Every image in `docs/missing-images.md` downloaded and');
    L.push('verified successfully, and the references were repointed to local files.');
    L.push('');
    fs.writeFileSync(OUT_MD, L.join('\n'), 'utf8');
    return;
  }
  L.push(`**${failed.length} image reference(s) could not be downloaded** and still point`);
  L.push('at the Shopee CDN. They keep working from Shopee — nothing is broken — but');
  L.push('they need to be supplied by hand.');
  L.push('');
  L.push('## How to use this list');
  L.push('');
  L.push('1. Save the image at the exact path in **Expected local file**.');
  L.push('2. Run `node scripts/migrate-images.js --apply`.');
  L.push('');
  L.push('## Summary');
  L.push('');
  L.push('| Category | Failed refs | Products affected |');
  L.push('|---|---:|---:|');
  for (const cat of order) {
    const list = byCat.get(cat);
    L.push(`| ${cat} | ${list.length} | ${new Set(list.map(r => r.product)).size} |`);
  }
  L.push(`| **Total** | **${failed.length}** | **${new Set(failed.map(r => r.product)).size}** |`);
  L.push('');

  for (const cat of order) {
    const list = byCat.get(cat).slice().sort((a, b) =>
      a.product.localeCompare(b.product) || String(a.sku).localeCompare(String(b.sku)));
    L.push(`## ${cat} — ${list.length} failed`);
    L.push('');
    L.push('| Product | SKU | Slot | Page | Expected local file | Shopee URL | Failure |');
    L.push('|---|---|---|---|---|---|---|');
    for (const r of list) {
      L.push(`| ${r.product} | ${r.sku || '—'} | ${r.slot} | \`${r.page}\` | ` +
             `\`${r.localPath}\` | ${r.url} | ${r.error} |`);
    }
    L.push('');
  }
  fs.writeFileSync(OUT_MD, L.join('\n'), 'utf8');
}

/* ── plan ─────────────────────────────────────────── */

const skuSlug = s => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* One entry per distinct URL: which file(s) to write, and whether the wiring
   needs an explicit URL->path provenance record rather than the convention. */
function buildPlan(rows) {
  const byUrl = new Map();
  for (const r of rows) {
    if (!byUrl.has(r.url)) byUrl.set(r.url, []);
    byUrl.get(r.url).push(r);
  }

  // A path wanted by more than one URL cannot be named by convention.
  const urlsPerPath = new Map();
  for (const r of rows) {
    if (!urlsPerPath.has(r.localPath)) urlsPerPath.set(r.localPath, new Set());
    urlsPerPath.get(r.localPath).add(r.url);
  }
  const ambiguous = new Set([...urlsPerPath].filter(([, u]) => u.size > 1).map(([p]) => p));

  const plan = [];
  for (const [url, refs] of byUrl) {
    const collides = refs.some(r => ambiguous.has(r.localPath));
    if (collides) {
      // Name after this photo's own SKU so each variant keeps its own picture.
      const dir = path.posix.dirname(refs[0].localPath);
      plan.push({
        url, refs, collides: true,
        outPaths: [path.posix.join(dir, `${skuSlug(refs[0].sku)}.jpg`)],
      });
    } else {
      plan.push({
        url, refs, collides: false,
        outPaths: [...new Set(refs.map(r => r.localPath))],
      });
    }
  }

  // Two photographs must never end up sharing one filename.
  const owner = new Map();
  for (const p of plan) {
    for (const out of p.outPaths) {
      if (owner.has(out) && owner.get(out) !== p.url) {
        throw new Error(`filename collision unresolved: ${out}`);
      }
      owner.set(out, p.url);
    }
  }
  return { plan, ambiguousCount: ambiguous.size };
}

/* Shape a data/_image-check.json row. buildUrlMap() in migrate-images.js
   rebuilds the path as images/products/<category>/<id>/<filename>, so `id`
   must be the folder name and `sku` must belong to the owning product (it is
   the fallback used to resolve the category). */
function provenanceFor(item, outPath, result) {
  const abs = path.join(ROOT, outPath);
  return {
    url:      item.url,
    id:       path.posix.basename(path.posix.dirname(outPath)),
    sku:      item.refs[0].sku,
    type:     'variant',
    filename: path.posix.basename(outPath),
    status:   200,
    size:     result ? result.buf.length : (fs.existsSync(abs) ? fs.statSync(abs).size : 0),
    ok:       true,
  };
}

/* Record url -> <folder>/<filename> so migrate-images.js can wire the
   collision-renamed files by provenance instead of by filename convention.
   Idempotent: an entry for the same URL is replaced, never duplicated. */
function recordProvenance(entries) {
  if (!entries.length) return 0;
  const check = JSON.parse(fs.readFileSync(CHECK, 'utf8'));
  const byUrl = new Map(check.map((e, i) => [e.url, i]));
  let added = 0, replaced = 0;
  for (const e of entries) {
    if (byUrl.has(e.url)) { check[byUrl.get(e.url)] = e; replaced++; }
    else { check.push(e); added++; }
  }
  fs.writeFileSync(CHECK, JSON.stringify(check, null, 2) + '\n', 'utf8');
  console.log(`provenance        : ${added} added, ${replaced} replaced in data/_image-check.json`);
  return added + replaced;
}

/* ── main ─────────────────────────────────────────── */

async function main() {
  const rows = parseWorklist();
  console.log(`worklist          : ${rows.length} references from docs/missing-images.md`);

  const { plan, ambiguousCount } = buildPlan(rows);
  console.log(`unique URLs       : ${plan.length}`);
  const collided = plan.filter(p => p.collides);
  if (collided.length) {
    console.log(`name collisions   : ${ambiguousCount} convention paths wanted by 2+ photos`);
    console.log(`                    -> ${collided.length} URL(s) saved under a SKU-qualified`);
    console.log(`                       name + registered in data/_image-check.json`);
  }

  const ok = [], skipped = [], failed = [], provenance = [];
  const formats = {};

  if (DRY_RUN) {
    console.log('\nsample of the collision-renamed files:');
    for (const p of collided.slice(0, 6)) {
      console.log(`  ${p.refs.map(r => r.sku).join(', ')}`);
      console.log(`    convention wanted : ${p.refs[0].localPath}`);
      console.log(`    will write        : ${p.outPaths[0]}`);
    }
    console.log('\n--dry-run: nothing downloaded.');
    return;
  }

  let n = 0;
  const work = plan.slice(0, LIMIT === Infinity ? undefined : LIMIT);

  for (const item of work) {
    const { url, refs, outPaths, collides } = item;
    n++;

    // Resumable: only fetch when a target file is still absent.
    const need = outPaths.filter(p => {
      const abs = path.join(ROOT, p);
      return !(fs.existsSync(abs) && fs.statSync(abs).size > 0);
    });
    if (!need.length) {
      for (const r of refs) skipped.push({ ...r, outPath: outPaths[0] });
      if (collides) provenance.push(provenanceFor(item, outPaths[0]));
      continue;
    }

    process.stdout.write(`[${n}/${work.length}] ${refs[0].sku} → ${need[0]} `);

    let result;
    try {
      result = await download(url);
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      for (const r of refs) failed.push({ ...r, error: err.message });
      await sleep(THROTTLE_MS);
      continue;
    }

    formats[result.format] = (formats[result.format] || 0) + 1;

    let wrote = 0, writeErr = null;
    for (const rel of need) {
      const abs = path.join(ROOT, rel);
      try {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, result.buf);
        // Re-read the header from disk: a truncated write must not pass.
        const head = Buffer.alloc(12);
        const fd = fs.openSync(abs, 'r');
        const read = fs.readSync(fd, head, 0, 12, 0);
        fs.closeSync(fd);
        if (read < 12 || !imageFormat(head) || fs.statSync(abs).size !== result.buf.length) {
          fs.unlinkSync(abs);
          throw new Error('written file failed verification');
        }
        wrote++;
      } catch (err) { writeErr = err; }
    }

    if (writeErr && !wrote) {
      console.log(`FAILED (${writeErr.message})`);
      for (const r of refs) failed.push({ ...r, error: writeErr.message });
    } else {
      console.log(`ok (${(result.buf.length / 1024).toFixed(0)}KB ${result.format}` +
                  `${wrote > 1 ? `, ${wrote} copies` : ''}${collides ? ', renamed' : ''})`);
      for (const r of refs) ok.push({ ...r, outPath: outPaths[0], bytes: result.buf.length, format: result.format });
      if (collides) provenance.push(provenanceFor(item, outPaths[0], result));
    }

    await sleep(THROTTLE_MS);
  }

  recordProvenance(provenance);

  /* Counts are per image REFERENCE (368 in the worklist), not per file —
     several references legitimately resolve to one shared photograph. */
  const files = new Set(ok.map(r => r.outPath));
  console.log('\n══ summary ══');
  console.log(`downloaded OK     : ${ok.length} refs  (${files.size} files, ${Object.values(formats).reduce((a, b) => a + b, 0)} downloads)`);
  console.log(`skipped (existing): ${skipped.length} refs`);
  console.log(`FAILED            : ${failed.length} refs`);
  console.log(`formats           : ${JSON.stringify(formats)}`);
  const nonJpeg = ok.filter(r => r.format !== 'jpeg');
  if (nonJpeg.length) {
    console.log(`note              : ${nonJpeg.length} file(s) are not JPEG but keep the ` +
                `.jpg name required by the migration convention (browsers sniff the header).`);
  }
  if (failed.length) {
    console.log('\nfailed refs:');
    for (const f of failed) console.log(`  ${f.product} ${f.sku}  ${f.url}\n    ${f.error}`);
  }

  writeStillMissing(failed);
  fs.writeFileSync(OUT_JSON, JSON.stringify({
    generated: new Date().toISOString(),
    worklistRefs: rows.length,
    uniqueUrls: plan.length,
    downloadedOkRefs: ok.length,
    filesWritten: files.size,
    skippedExistingRefs: skipped.length,
    failedRefs: failed.length,
    formats,
    renamedForCollision: collided.map(p => ({
      url: p.url,
      skus: p.refs.map(r => r.sku),
      conventionWanted: p.refs[0].localPath,
      writtenTo: p.outPaths[0],
    })),
    provenanceRows: provenance.length,
    ok, skipped, failed,
  }, null, 2) + '\n', 'utf8');

  console.log(`\nwrote docs/still-missing-images.md (${failed.length} rows)`);
  console.log('wrote data/_shopee-fetch-report.json');
  console.log('\nnext: node scripts/migrate-images.js --apply');
}

main().catch(err => { console.error(err); process.exit(1); });
