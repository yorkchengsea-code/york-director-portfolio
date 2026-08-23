import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(siteRoot, '../../..');
const assetManifestPath = path.resolve(siteRoot, '../website-refresh-2026-08-22-v2-asset-manifest.json');
const selectionManifestPath = path.join(
  workspaceRoot,
  '導演功課/導演作品集/portfolio-deck-whitelist-integration-2026-08-13-v1/selection-manifest-v6-r10.json'
);
const gamblingPicksPath = path.join(
  workspaceRoot,
  'case-template-claude-2026-08-16/gambling-york-picks.json'
);
const gamblingSourceRoot = path.join(
  workspaceRoot,
  'assets/gambling-dense-library-49-films/01_正式廣告主片'
);

const readSite = relative => fs.readFile(path.join(siteRoot, relative), 'utf8');
const readJson = async filename => JSON.parse(await fs.readFile(filename, 'utf8'));
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const normalize = value => String(value || '').replaceAll('\\', '/');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const renderedViews = [];

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png']
]);

const startStaticServer = () => new Promise((resolve, reject) => {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      const pathname = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
      const target = path.resolve(siteRoot, pathname.replace(/^\/+/, ''));
      if (target !== siteRoot && !target.startsWith(`${siteRoot}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const body = await fs.readFile(target);
      response.writeHead(200, {
        'Content-Type': contentTypes.get(path.extname(target).toLowerCase()) || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server));
});

const data = JSON.parse(await readSite('site-data.json'));
const html = await readSite('index.html');
const css = await readSite('css/style.css');
const js = await readSite('js/script.js');

check(data.schema === 'york-director-website-v4', `unexpected site-data schema: ${data.schema}`);
check(Array.isArray(data.works), 'site-data.works must be an array');
check(data.works?.length === 31, `works must contain 31 linked entries, found ${data.works?.length ?? 0}`);
check(Array.isArray(data.filmography), 'site-data.filmography must be an array');
check(data.filmography?.length === 58, `filmography must contain 58 entries, found ${data.filmography?.length ?? 0}`);
check(data.gambling_commercials && typeof data.gambling_commercials === 'object', 'gambling_commercials section is missing');

const filmography = Array.isArray(data.filmography) ? data.filmography : [];
const filmographyTitles = filmography.map(title => String(title).trim());
check(filmographyTitles.every(Boolean), 'filmography contains a blank title');
check(new Set(filmographyTitles).size === 58, `filmography must contain 58 unique titles, found ${new Set(filmographyTitles).size}`);

const works = Array.isArray(data.works) ? data.works : [];
const workIds = works.map(work => work.id);
check(new Set(workIds).size === works.length, 'work ids must be unique');
check(!workIds.includes('fat-taro'), 'fat-taro must remain in Filmography until a public film URL is verified');
check(!workIds.includes('gambling-collection'), 'gambling collection must not masquerade as a linked case');
check(filmographyTitles.includes('胖太郎捉妖記'), 'fat-taro must remain listed in Filmography');
check(data.gambling_commercials?.title_zh === '博弈廣告作品', 'gambling Chinese title must use the approved wording');
check(data.gambling_commercials?.title_en === 'GAMBLING COMMERCIALS', 'gambling English title must use the approved wording');
check(data.gambling_commercials?.image === 'assets/works/gambling-commercials.webp', 'gambling image path is incorrect');
check(works.every(work => Array.isArray(work.videos) && work.videos.length > 0), 'every WORKS case must have at least one public full-film link');
check(data.contact?.email === 'hey.yuhsuncheng@gmail.com', 'contact email must use the approved director address');

for (const legacyKey of ['flagship', 'selected', 'additional', 'archive', 'gambling']) {
  check(!Object.hasOwn(data, legacyKey), `legacy tier key remains in site-data: ${legacyKey}`);
}
check(!Object.hasOwn(data.director || {}, 'facts'), 'director.facts metric block must be removed');

const publicText = [html, JSON.stringify(data), css, js].join('\n');
const forbiddenTokens = [
  '_removed_works',
  'views_note',
  '1982478',
  '2390008',
  '88+',
  '一手包辦',
  '王依淳',
  '旗艦作品',
  'Flagship Works',
  'SELECTED WORKS',
  'Selected Works',
  'Additional Selected',
  '延伸精選',
  '01 / FLAGSHIP',
  '博弈廣告作品合輯',
  'Gambling Film Collection',
  'Commercial Film Collection',
  '東南亞',
  'KOL',
  '行銷代理',
  '曜境影像',
  'N23',
  '9 YEARS',
  '100+ PROJECTS',
  '年導演經驗',
  '執導專案',
  '49 支作品集中呈現',
  '支商業廣告',
  '支社群影片'
];
for (const forbidden of forbiddenTokens) {
  check(!publicText.toLocaleLowerCase('en').includes(forbidden.toLocaleLowerCase('en')), `public source contains forbidden token: ${forbidden}`);
}
const forbiddenPatterns = [
  [/\bflagship\b/i, 'flagship classification'],
  [/\bselected\s+(?:works?|projects?|films?)\b/i, 'selected classification'],
  [/\badditional\b/i, 'additional classification'],
  [/\barchive\b/i, 'archive classification'],
  [/(?:hero|about)-facts|gambling-stats/i, 'legacy metric block'],
  [/\b9\s*years?\b/i, '9-year metric'],
  [/100\s*\+\s*projects?/i, '100+ projects metric'],
  [/49\s*支/i, '49-work metric'],
  [/43\s*支/i, '43-commercial metric'],
  [/6\s*支社群/i, '6-social-film metric'],
  [/"(?:films|commercials|social_films)"\s*:\s*"(?:49|43|6)"/i, 'legacy metric data field']
];
for (const [pattern, label] of forbiddenPatterns) {
  check(!pattern.test(publicText), `public source contains forbidden ${label}: ${pattern}`);
}

const videoIds = works.flatMap(work => work.videos || []).map(video => video.id);
check(videoIds.length === 37, `expected 37 public video ids, found ${videoIds.length}`);
check(new Set(videoIds).size === 37, `expected 37 unique public video ids, found ${new Set(videoIds).size}`);
for (const id of videoIds) check(/^[A-Za-z0-9_-]{11}$/.test(id), `invalid YouTube id: ${id}`);

const images = new Set([
  ...works.map(work => work.image),
  data.gambling_commercials?.image,
  'assets/portrait.jpg',
  'assets/og-york-director.jpg'
]);
for (const image of images) {
  try {
    const stat = await fs.stat(path.join(siteRoot, image));
    check(stat.isFile(), `image path is not a file: ${image}`);
    check(stat.size > 1000, `image is unexpectedly small: ${image}`);
  } catch {
    failures.push(`missing image: ${image}`);
  }
}

let assetManifest = null;
try {
  assetManifest = await readJson(assetManifestPath);
} catch (error) {
  failures.push(`missing or unreadable asset manifest: ${assetManifestPath} (${error.code || error.message})`);
}

let selectionManifest = null;
try {
  selectionManifest = await readJson(selectionManifestPath);
} catch (error) {
  failures.push(`missing or unreadable selection manifest: ${selectionManifestPath} (${error.code || error.message})`);
}

let gamblingPicks = null;
try {
  gamblingPicks = await readJson(gamblingPicksPath);
} catch (error) {
  failures.push(`missing or unreadable gambling picks: ${gamblingPicksPath} (${error.code || error.message})`);
}

const selectedHashes = new Set(
  (selectionManifest?.projects || [])
    .flatMap(project => project.images || [])
    .filter(image => image.user_selected === true)
    .map(image => String(image.sha256).toLowerCase())
);
check(selectedHashes.size > 0, 'selection manifest contains no user_selected=true hashes');

const gamblingHashes = new Set();
for (const pick of gamblingPicks || []) {
  if (pick.exists === false) continue;
  try {
    const source = path.join(gamblingSourceRoot, pick.file);
    gamblingHashes.add(sha256(await fs.readFile(source)).toLowerCase());
  } catch (error) {
    failures.push(`missing York-picked gambling source: ${pick.file} (${error.code || error.message})`);
  }
}
check(gamblingHashes.size > 0, 'gambling picks contain no readable source files');

if (assetManifest) {
  check(assetManifest.schema === 'york-website-image-build-v2', `unexpected asset manifest schema: ${assetManifest.schema}`);
  const items = Array.isArray(assetManifest.items) ? assetManifest.items : [];
  check(items.length === 32, `asset manifest must contain 32 items, found ${items.length}`);
  check(new Set(items.map(item => item.slug)).size === items.length, 'asset manifest slugs must be unique');
  const expectedAssetSlugs = [...workIds, 'gambling-commercials'];
  check(
    JSON.stringify(items.map(item => item.slug).sort()) === JSON.stringify(expectedAssetSlugs.sort()),
    'asset manifest slugs do not exactly match linked work ids plus gambling-commercials'
  );

  const ordinary = items.filter(item => item.slug !== 'gambling-commercials');
  check(ordinary.length === 31, `asset manifest must contain 31 ordinary selected images, found ${ordinary.length}`);

  const publishedWorkAssets = (await fs.readdir(path.join(siteRoot, 'assets/works')))
    .filter(filename => /\.(?:webp|png|jpe?g)$/i.test(filename))
    .map(filename => `assets/works/${filename}`)
    .sort();
  const manifestOutputs = items.map(item => normalize(item.output)).sort();
  check(
    JSON.stringify(publishedWorkAssets) === JSON.stringify(manifestOutputs),
    'assets/works contains an orphan or missing image outside the approved manifest'
  );

  for (const item of items) {
    const sourcePath = normalize(item.source);
    const sourceHash = String(item.sourceSha256 || '').toLowerCase();
    const outputPath = normalize(item.output);
    const contentItem = item.slug === 'gambling-commercials'
      ? data.gambling_commercials
      : works.find(candidate => candidate.id === item.slug);

    check(!/(^|\/)candidates(\/|$)/i.test(sourcePath), `candidate-pool source is forbidden: ${sourcePath}`);
    check(contentItem?.image === outputPath, `asset output does not match site-data for ${item.slug}: ${outputPath}`);
    check(/^[a-f0-9]{64}$/.test(sourceHash), `invalid source SHA-256 for ${item.slug}`);

    if (item.slug === 'gambling-commercials') {
      check(gamblingHashes.has(sourceHash), 'gambling-commercials source SHA is not one of York\'s gambling picks');
    } else {
      check(selectedHashes.has(sourceHash), `ordinary work source is not user_selected=true: ${item.slug}`);
    }

    try {
      const sourceBuffer = await fs.readFile(path.join(workspaceRoot, item.source));
      check(sha256(sourceBuffer).toLowerCase() === sourceHash, `source SHA does not match actual file: ${item.slug}`);
    } catch (error) {
      failures.push(`missing asset source for ${item.slug}: ${sourcePath} (${error.code || error.message})`);
    }

    try {
      const outputBuffer = await fs.readFile(path.join(siteRoot, item.output));
      check(sha256(outputBuffer).toLowerCase() === String(item.outputSha256 || '').toLowerCase(), `output SHA does not match actual file: ${item.slug}`);
    } catch (error) {
      failures.push(`missing asset output for ${item.slug}: ${outputPath} (${error.code || error.message})`);
    }
  }

  const socialPreview = assetManifest.socialPreview || {};
  check(socialPreview.output === 'assets/og-york-director.jpg', 'asset manifest social preview path is incorrect');
  try {
    const ogBuffer = await fs.readFile(path.join(siteRoot, socialPreview.output));
    check(sha256(ogBuffer).toLowerCase() === String(socialPreview.outputSha256 || '').toLowerCase(), 'social preview SHA does not match actual file');
  } catch (error) {
    failures.push(`missing social preview output (${error.code || error.message})`);
  }
}

async function validateRenderedSite() {
  let server;
  let browser;
  try {
    const playwrightEntry = path.join(
      workspaceRoot,
      '導演功課/導演作品集/全量版/node_modules/playwright/index.mjs'
    );
    const { chromium } = await import(pathToFileURL(playwrightEntry).href);
    server = await startStaticServer();
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    check(Number.isInteger(port) && port > 0, 'rendered validator failed to obtain a local port');
    browser = await chromium.launch({ headless: true });

    for (const viewport of [
      { label: 'desktop', width: 1440, height: 900 },
      { label: 'mobile', width: 390, height: 844 }
    ]) {
      const page = await browser.newPage({ viewport });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(String(error.message || error)));
      await page.goto(`http://127.0.0.1:${port}/?validate=${viewport.label}#hero`, { waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelectorAll('.work-card').length === 31);
      await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));

      const metrics = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        const forbidden = [
          '9 YEARS', '100+ PROJECTS', '49 支', '43 支', '6 支社群',
          'Flagship', 'Selected Works', 'Additional Selected', 'Archive'
        ].filter(token => bodyText.toLowerCase().includes(token.toLowerCase()));
        const watchLinks = [...document.querySelectorAll('.watch-link')];
        return {
          workCards: document.querySelectorAll('.work-card').length,
          watchLinks: watchLinks.length,
          visibleWatchLinks: watchLinks.filter(link => {
            const style = getComputedStyle(link);
            const box = link.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
          }).length,
          filmographyItems: document.querySelectorAll('.filmography-item').length,
          gamblingTitle: document.querySelector('#gambling-title')?.textContent?.trim(),
          gamblingLinks: document.querySelectorAll('#gambling a, #gambling button').length,
          brokenImages: [...document.images]
            .filter(image => !image.complete || image.naturalWidth === 0)
            .map(image => image.getAttribute('src')),
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          forbidden
        };
      });

      check(metrics.workCards === 31, `${viewport.label} rendered WORKS count is ${metrics.workCards}, expected 31`);
      check(metrics.watchLinks === 31, `${viewport.label} rendered watch-link count is ${metrics.watchLinks}, expected 31`);
      check(metrics.visibleWatchLinks === 31, `${viewport.label} has hidden full-film links (${metrics.visibleWatchLinks}/31 visible)`);
      check(metrics.filmographyItems === 58, `${viewport.label} rendered Filmography count is ${metrics.filmographyItems}, expected 58`);
      check(metrics.gamblingTitle === '博弈廣告作品', `${viewport.label} rendered gambling title is incorrect`);
      check(metrics.gamblingLinks === 0, `${viewport.label} gambling showcase must not contain an unverified link`);
      check(metrics.brokenImages.length === 0, `${viewport.label} has broken images: ${metrics.brokenImages.join(', ')}`);
      check(!metrics.horizontalOverflow, `${viewport.label} has horizontal overflow`);
      check(metrics.forbidden.length === 0, `${viewport.label} renders forbidden text: ${metrics.forbidden.join(', ')}`);

      const modalChecks = viewport.label === 'desktop' ? 31 : 1;
      for (let index = 0; index < modalChecks; index += 1) {
        await page.locator('.watch-link').nth(index).click();
        const modalState = await page.evaluate(() => ({
          open: Boolean(document.querySelector('#video-dialog')?.open),
          iframeCount: document.querySelectorAll('#video-frame iframe').length,
          iframeSrc: document.querySelector('#video-frame iframe')?.getAttribute('src') || ''
        }));
        check(modalState.open, `${viewport.label} work ${index + 1} did not open the video dialog`);
        check(modalState.iframeCount === 1, `${viewport.label} work ${index + 1} rendered ${modalState.iframeCount} video iframes`);
        check(
          modalState.iframeSrc.startsWith('https://www.youtube-nocookie.com/embed/'),
          `${viewport.label} work ${index + 1} did not use the approved YouTube embed`
        );
        await page.locator('#video-close').click();
        const closedIframeCount = await page.locator('#video-frame iframe').count();
        check(closedIframeCount === 0, `${viewport.label} work ${index + 1} left an iframe after closing`);
      }

      check(pageErrors.length === 0, `${viewport.label} page errors: ${pageErrors.join(' | ')}`);
      renderedViews.push({ ...viewport, ...metrics, modalChecks, pageErrors: pageErrors.length });
      await page.close();
    }
  } catch (error) {
    failures.push(`rendered validation failed: ${error.stack || error.message || error}`);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

if (process.argv.includes('--rendered')) await validateRenderedSite();

if (process.argv.includes('--online')) {
  for (let offset = 0; offset < videoIds.length; offset += 6) {
    const batch = videoIds.slice(offset, offset + 6);
    const results = await Promise.all(batch.map(async id => {
      const url = `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        return { id, ok: response.ok, status: response.status };
      } catch (error) {
        return { id, ok: false, status: error.name || 'network-error' };
      }
    }));
    for (const result of results) check(result.ok, `YouTube oEmbed failed: ${result.id} (${result.status})`);
  }
}

check(html.includes('assets/og-york-director.jpg'), 'Open Graph preview is missing');
check(html.includes('id="gambling"'), 'gambling showcase section is missing from index.html');
check(html.includes('GAMBLING COMMERCIALS'), 'approved gambling label is missing from index.html');
check(html.includes('mailto:hey.yuhsuncheng@gmail.com'), 'approved contact mailto is missing from index.html');
check(css.includes('@media(max-width:680px)'), 'mobile breakpoint is missing');
check(js.includes('youtube-nocookie.com/embed/'), 'privacy-enhanced YouTube embed is missing');
check(js.includes('window.location.hash'), 'hash navigation recovery is missing');

if (failures.length) {
  console.error(JSON.stringify({ status: 'FAIL', failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  works: works.length,
  filmography: filmographyTitles.length,
  uniqueFilmography: new Set(filmographyTitles).size,
  videoIds: videoIds.length,
  ordinarySelectedImages: assetManifest.items.filter(item => item.slug !== 'gambling-commercials').length,
  gamblingSelectedImages: assetManifest.items.filter(item => item.slug === 'gambling-commercials').length,
  onlineVideoCheck: process.argv.includes('--online'),
  renderedCheck: process.argv.includes('--rendered'),
  renderedViews,
  imageAssets: images.size
}, null, 2));
