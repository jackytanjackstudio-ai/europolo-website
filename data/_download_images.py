import json, os, re, time
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR   = r'C:\Users\User\Desktop\euro polo.web\europolo-website'
IMAGES_DIR = os.path.join(BASE_DIR, 'images', 'products')
DATA_FILE  = os.path.join(BASE_DIR, 'data', 'product-data.json')
REPORT_FILE = os.path.join(BASE_DIR, 'data', 'download-report.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://shopee.com.my/',
}

def sanitize_id(pid):
    s = re.sub(r'[&]', '', pid)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')

def download_image(url, filepath, retries=3):
    for attempt in range(retries):
        try:
            req = Request(url, headers=HEADERS)
            with urlopen(req, timeout=20) as r:
                content = r.read()
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'wb') as f:
                f.write(content)
            return len(content), None
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1.5)
            else:
                return 0, str(e)

# ── Load products ──────────────────────────────────────────────────────────────
with open(DATA_FILE, encoding='utf-8') as f:
    data = json.load(f)

products = data['products']

# ── Build task list (ordered: cover first, then gallery in index order) ────────
tasks = []
for p in products:
    original_id = p['id']
    san_id      = sanitize_id(original_id)
    cat         = p['category']
    folder      = os.path.join(IMAGES_DIR, cat, san_id)
    local_base  = f'images/products/{cat}/{san_id}'

    cover_url = p['images']['cover']
    if cover_url:
        tasks.append({
            'product_id':   original_id,
            'sanitized_id': san_id,
            'category':     cat,
            'url':          cover_url,
            'filepath':     os.path.join(folder, 'cover.jpg'),
            'local_path':   f'{local_base}/cover.jpg',
            'type':         'cover',
            'index':        0,
        })

    for idx, url in enumerate(p['images']['gallery'], 1):
        if url:
            filename = f'gallery-{idx}.jpg'
            tasks.append({
                'product_id':   original_id,
                'sanitized_id': san_id,
                'category':     cat,
                'url':          url,
                'filepath':     os.path.join(folder, filename),
                'local_path':   f'{local_base}/{filename}',
                'type':         'gallery',
                'index':        idx,
            })

# ── Download ───────────────────────────────────────────────────────────────────
print(f'Downloading {len(tasks)} images across {len(products)} products...')
print()

t0      = time.time()
results = {}   # filepath -> result dict
done    = 0

with ThreadPoolExecutor(max_workers=15) as ex:
    futures = {ex.submit(download_image, t['url'], t['filepath']): t for t in tasks}
    for fut in as_completed(futures):
        task        = futures[fut]
        size, error = fut.result()
        results[task['filepath']] = {**task, 'size': size, 'error': error, 'ok': error is None}
        done += 1
        if done % 50 == 0:
            elapsed_so_far = time.time() - t0
            print(f'  {done}/{len(tasks)}  ({elapsed_so_far:.0f}s elapsed)')

elapsed = time.time() - t0

# ── Separate ok / failed ───────────────────────────────────────────────────────
ok_results   = [r for r in results.values() if r['ok']]
fail_results = [r for r in results.values() if not r['ok']]

# ── Build per-product local image mapping (ordered) ───────────────────────────
local_images = {}
for task in tasks:                        # tasks is in order (cover first, gallery by index)
    pid = task['product_id']
    r   = results[task['filepath']]
    if pid not in local_images:
        local_images[pid] = {'cover': None, 'gallery': []}
    if r['ok']:
        if task['type'] == 'cover':
            local_images[pid]['cover'] = task['local_path']
        else:
            local_images[pid]['gallery'].append(task['local_path'])

# ── Update product-data.json ───────────────────────────────────────────────────
for p in products:
    original_id = p['id']
    san_id      = sanitize_id(original_id)

    # Sanitize ID field
    if san_id != original_id:
        p['_originalId']   = original_id
        p['id']            = san_id

    p['localImagePath'] = f'images/products/{p["category"]}/{san_id}/'

    # Preserve Shopee source URLs, update images to local paths
    p['sourceImages'] = {
        'cover':   p['images']['cover'],
        'gallery': list(p['images']['gallery']),
    }
    locs = local_images.get(original_id, {'cover': None, 'gallery': []})
    p['images']['cover']   = locs['cover']   or p['images']['cover']
    p['images']['gallery'] = locs['gallery'] if locs['gallery'] else p['images']['gallery']

with open(DATA_FILE, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# ── Build download-report.json ─────────────────────────────────────────────────
total_bytes = sum(r['size'] for r in ok_results)

by_product = {}
for task in tasks:
    pid = task['product_id']
    if pid not in by_product:
        by_product[pid] = {
            'id':           sanitize_id(pid),
            'originalId':   pid,
            'category':     task['category'],
            'coverPath':    None,
            'galleryPaths': [],
            'imageCount':   0,
            'sizeKB':       0,
            'failures':     [],
        }
    r = results[task['filepath']]
    if r['ok']:
        if task['type'] == 'cover':
            by_product[pid]['coverPath'] = task['local_path']
        else:
            by_product[pid]['galleryPaths'].append(task['local_path'])
        by_product[pid]['imageCount'] += 1
        by_product[pid]['sizeKB']     += round(r['size'] / 1024, 1)
    else:
        by_product[pid]['failures'].append({
            'type':     task['type'],
            'filename': os.path.basename(task['filepath']),
            'url':      task['url'],
            'error':    r['error'],
        })

by_cat = {}
for p in by_product.values():
    cat = p['category']
    by_cat.setdefault(cat, {'products': 0, 'images': 0, 'sizeKB': 0})
    by_cat[cat]['products'] += 1
    by_cat[cat]['images']   += p['imageCount']
    by_cat[cat]['sizeKB']   += p['sizeKB']

report = {
    'generated':      '2026-06-05',
    'downloadedAt':   time.strftime('%Y-%m-%dT%H:%M:%S'),
    'totalImages':    len(tasks),
    'succeeded':      len(ok_results),
    'failed':         len(fail_results),
    'totalSizeMB':    round(total_bytes / 1024 / 1024, 2),
    'elapsedSeconds': round(elapsed, 1),
    'byCategory':     {
        cat: {
            'products': v['products'],
            'images':   v['images'],
            'sizeMB':   round(v['sizeKB'] / 1024, 2),
        }
        for cat, v in sorted(by_cat.items())
    },
    'failures': [
        {'id': r['product_id'], 'type': r['type'], 'url': r['url'], 'error': r['error']}
        for r in fail_results
    ],
    'products': list(by_product.values()),
}

with open(REPORT_FILE, 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

# ── Console summary ────────────────────────────────────────────────────────────
print()
print('=' * 50)
print(f'Download complete in {elapsed:.1f}s')
print(f'Succeeded : {len(ok_results)}/{len(tasks)} images')
print(f'Failed    : {len(fail_results)}')
print(f'Total size: {total_bytes/1024/1024:.1f} MB')
print()
print('By category:')
for cat, v in sorted(by_cat.items()):
    print(f'  {cat:<10}  {v["products"]:>2} products  {v["images"]:>4} images  {v["sizeKB"]/1024:.1f} MB')
if fail_results:
    print()
    print('FAILURES:')
    for r in fail_results:
        print(f'  [{r["product_id"]}] {r["type"]} — {r["error"]}')
print()
print('Written: data/download-report.json')
print('Updated: data/product-data.json  (images -> local paths, sourceImages preserved)')
