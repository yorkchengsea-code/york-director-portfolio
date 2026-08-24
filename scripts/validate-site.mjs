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
const expectedGamblingWallSources = [
  'assets/gambling-dense-library-49-films/01_正式廣告主片/002_滿貫大亨_舞獅篇/frame-19-t9.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/010_滿貫大亨911_神力卡篇/frame-19-t9.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/011_滿貫大亨911_加菜篇/frame-11-t5.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/012_滿貫大亨911_急速玖壹壹篇/frame-15-t7.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/012_滿貫大亨911_急速玖壹壹篇/frame-19-t9.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/013_聚寶online禮生團_開光篇/frame-02-t0.500.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/014_聚寶online_攏總來篇/frame-19-t9.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/030_王牌俱樂部_黃金在手篇/frame-07-t3.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/030_王牌俱樂部_黃金在手篇/frame-11-t5.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/034_包你發_中秋工地篇/frame-06-t2.500.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/035_包你發_世足台灣隊篇/frame-05-t2.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/037_金好運_森巴篇/frame-10-t4.500.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/038_老子有錢_機車篇/frame-18-t8.500.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/039_老子有錢_節目橋段篇/frame-21-t10.000.png',
  'assets/gambling-dense-library-49-films/01_正式廣告主片/042_老子有錢_跑車篇/frame-22-t10.500.png'
];
const expectedGamblingWallOutputs = [
  'assets/gambling-wall/01-manguan-lion.webp',
  'assets/gambling-wall/02-manguan-power-card.webp',
  'assets/gambling-wall/03-manguan-dinner.webp',
  'assets/gambling-wall/04-manguan-speed-911-a.webp',
  'assets/gambling-wall/05-manguan-speed-911-b.webp',
  'assets/gambling-wall/06-jubao-blessing.webp',
  'assets/gambling-wall/07-jubao-all-come.webp',
  'assets/gambling-wall/08-ace-gold-a.webp',
  'assets/gambling-wall/09-ace-gold-b.webp',
  'assets/gambling-wall/10-baonifa-midautumn.webp',
  'assets/gambling-wall/11-baonifa-worldcup.webp',
  'assets/gambling-wall/12-goodluck-samba.webp',
  'assets/gambling-wall/13-rich-motorcycle.webp',
  'assets/gambling-wall/14-rich-show-segment.webp',
  'assets/gambling-wall/15-rich-sports-car.webp'
];

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
check(data.revision === '2026-08-24-v7-media-parity-gambling-wall', `unexpected site-data revision: ${data.revision}`);
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
const gamblingWallImages = Array.isArray(data.gambling_commercials?.images) ? data.gambling_commercials.images : [];
check(gamblingWallImages.length === 15, `gambling wall must contain 15 images, found ${gamblingWallImages.length}`);
check(
  JSON.stringify(gamblingWallImages.map(item => item.src)) === JSON.stringify(expectedGamblingWallOutputs),
  'gambling wall image sequence does not match the approved full-portfolio wall'
);
check(new Set(gamblingWallImages.map(item => item.src)).size === 15, 'gambling wall image paths must be unique');
check(gamblingWallImages.every(item => String(item.alt_zh || '').trim() && String(item.alt_en || '').trim()), 'every gambling wall image must have bilingual alt text');
check(works.every(work => Array.isArray(work.videos) && work.videos.length > 0), 'every WORKS case must have at least one public full-film link');
check(data.contact?.email === 'hey.yuhsuncheng@gmail.com', 'contact email must use the approved director address');

const quickSlides = data.quick_intro?.slides;
const expectedQuickVideoIds = [
  'rPfEga9kxU4', 'ep29rG5y45o', 'jcQ-spf44sI', 'Ct-1d0nXWRM', 'f9LeV0kl3a0',
  'slorjwyR06A', 'QMX1bwPORS8', 'SvUU0LTiEec', 'iIUDbPBPqSw', 'IOeQ5IwqYN0',
  'd_B7amkyM6Y', '3KVSg0WNciw', 'uAuxnr8chUE', '6YA5sBdlxXU'
];
check(Array.isArray(quickSlides), 'quick_intro.slides must be an array');
check(quickSlides?.length === 9, `quick_intro.slides must contain 9 entries, found ${quickSlides?.length ?? 0}`);
if (Array.isArray(quickSlides) && quickSlides.length === 9) {
  const quickVideoIds = quickSlides.flatMap(slide => slide.links || []).map(link => link.id);
  check(quickVideoIds.length === 14, `quick introduction must contain 14 film entries, found ${quickVideoIds.length}`);
  check(JSON.stringify(quickVideoIds) === JSON.stringify(expectedQuickVideoIds), 'quick introduction film IDs do not exactly match the approved sequence');
  for (const id of quickVideoIds) check(/^[A-Za-z0-9_-]{11}$/.test(id), `invalid quick-introduction YouTube id: ${id}`);
  check(quickSlides[0].theme === 'dark' && quickSlides[8].theme === 'dark', 'quick cover and contact themes must be dark');
  check(quickSlides.slice(1, 8).every((slide, index) => slide.theme === (index % 2 === 0 ? 'light' : 'dark')), 'quick evidence-slide themes do not alternate light/dark');
  check(!quickSlides[0].links?.length && !quickSlides[8].links?.length, 'quick cover/contact must not contain film entries');
  check(quickSlides[8].email === 'hey.yuhsuncheng@gmail.com', 'quick contact email is incorrect');
  for (let index = 1; index <= 7; index += 1) {
    const image = quickSlides[index].image;
    const expected = `assets/quick/slide-${String(index + 1).padStart(2, '0')}.webp`;
    check(image === expected, `quick slide ${index + 1} image path is incorrect: ${image}`);
    try {
      const buffer = await fs.readFile(path.join(siteRoot, image));
      check(buffer.length > 1000, `quick slide ${index + 1} image is unexpectedly small`);
      check(buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP', `quick slide ${index + 1} is not a valid WebP container`);
    } catch {
      failures.push(`missing quick slide image: ${image}`);
    }
  }
}

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
  ...gamblingWallImages.map(item => item.src),
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
    const contentItem = works.find(candidate => candidate.id === item.slug);

    check(!/(^|\/)candidates(\/|$)/i.test(sourcePath), `candidate-pool source is forbidden: ${sourcePath}`);
    if (item.slug === 'gambling-commercials') {
      check(outputPath === 'assets/works/gambling-commercials.webp', `legacy gambling representative output path is incorrect: ${outputPath}`);
    } else {
      check(contentItem?.image === outputPath, `asset output does not match site-data for ${item.slug}: ${outputPath}`);
    }
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

  const mediaParity = {
    'hot-blooded-jianghu': {
      sourceFragment: '/熱血江湖：歸來/01_啦啦隊篇/',
      videoId: '8EgIgrQZv34'
    },
    'earth-revival': {
      sourceFragment: '/星球重啟/01_種田當大佬篇/',
      videoId: 'X1bRLBYQg8k'
    },
    'lost-ark': {
      sourceFragment: '/失落的方舟/01_命運篇/',
      videoId: '7-5QP4MJhto'
    }
  };
  for (const [slug, expected] of Object.entries(mediaParity)) {
    const item = items.find(candidate => candidate.slug === slug);
    const work = works.find(candidate => candidate.id === slug);
    check(normalize(item?.source).includes(expected.sourceFragment), `${slug} thumbnail is not from the same named film as its public video`);
    check(work?.videos?.some(video => video.id === expected.videoId), `${slug} is missing its approved matching public video`);
  }

  const wallItems = Array.isArray(assetManifest.gamblingWall) ? assetManifest.gamblingWall : [];
  check(wallItems.length === 15, `asset manifest gambling wall must contain 15 items, found ${wallItems.length}`);
  check(new Set(wallItems.map(item => item.slug)).size === wallItems.length, 'gambling wall manifest slugs must be unique');
  check(
    JSON.stringify(wallItems.map(item => normalize(item.source))) === JSON.stringify(expectedGamblingWallSources),
    'gambling wall source sequence does not match the approved full-portfolio wall'
  );
  check(
    JSON.stringify(wallItems.map(item => normalize(item.output))) === JSON.stringify(expectedGamblingWallOutputs),
    'gambling wall output sequence does not match site-data'
  );

  let publishedWallAssets = [];
  try {
    publishedWallAssets = (await fs.readdir(path.join(siteRoot, 'assets/gambling-wall')))
      .filter(filename => /\.(?:webp|png|jpe?g)$/i.test(filename))
      .map(filename => `assets/gambling-wall/${filename}`)
      .sort();
  } catch (error) {
    failures.push(`missing gambling wall asset directory (${error.code || error.message})`);
  }
  check(
    JSON.stringify(publishedWallAssets) === JSON.stringify([...expectedGamblingWallOutputs].sort()),
    'assets/gambling-wall contains an orphan or missing image outside the approved wall manifest'
  );

  for (let index = 0; index < wallItems.length; index += 1) {
    const item = wallItems[index];
    const sourcePath = normalize(item.source);
    const outputPath = normalize(item.output);
    const sourceHash = String(item.sourceSha256 || '').toLowerCase();
    check(!/(^|\/)candidates(\/|$)/i.test(sourcePath), `candidate-pool source is forbidden in gambling wall: ${sourcePath}`);
    check(sourcePath === expectedGamblingWallSources[index], `unexpected gambling wall source at position ${index + 1}: ${sourcePath}`);
    check(outputPath === expectedGamblingWallOutputs[index], `unexpected gambling wall output at position ${index + 1}: ${outputPath}`);
    check(item.width === 960 && item.height === 540, `gambling wall output ${index + 1} must be 960×540`);
    check(/^[a-f0-9]{64}$/.test(sourceHash), `invalid gambling wall source SHA-256 at position ${index + 1}`);
    try {
      const sourceBuffer = await fs.readFile(path.join(workspaceRoot, item.source));
      check(sha256(sourceBuffer).toLowerCase() === sourceHash, `gambling wall source SHA does not match actual file at position ${index + 1}`);
    } catch (error) {
      failures.push(`missing gambling wall source at position ${index + 1}: ${sourcePath} (${error.code || error.message})`);
    }
    try {
      const outputBuffer = await fs.readFile(path.join(siteRoot, item.output));
      check(sha256(outputBuffer).toLowerCase() === String(item.outputSha256 || '').toLowerCase(), `gambling wall output SHA does not match actual file at position ${index + 1}`);
    } catch (error) {
      failures.push(`missing gambling wall output at position ${index + 1}: ${outputPath} (${error.code || error.message})`);
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
      { label: 'tablet', width: 800, height: 900 },
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
        const gamblingWall = document.querySelector('#gambling-wall');
        const gamblingStills = [...document.querySelectorAll('#gambling-wall .gambling-still')];
        const gamblingCopy = document.querySelector('#gambling-copy');
        const gamblingCopyRange = document.createRange();
        if (gamblingCopy) gamblingCopyRange.selectNodeContents(gamblingCopy);
        const wallBox = gamblingWall?.getBoundingClientRect();
        const lastStillBox = gamblingStills.at(-1)?.getBoundingClientRect();
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
          gamblingStills: gamblingStills.length,
          gamblingColumns: gamblingWall
            ? getComputedStyle(gamblingWall).gridTemplateColumns.split(/\s+/).filter(Boolean).length
            : 0,
          gamblingAltsComplete: gamblingStills.every(still => Boolean(still.querySelector('img')?.alt.trim())),
          gamblingRatiosValid: gamblingStills.every(still => {
            const box = still.getBoundingClientRect();
            return Math.abs((box.width / box.height) - (16 / 9)) < 0.02;
          }),
          lastGamblingStillSpansWall: Boolean(
            wallBox && lastStillBox && Math.abs(wallBox.width - lastStillBox.width) < 1
          ),
          gamblingCopyLines: gamblingCopy ? gamblingCopyRange.getClientRects().length : 0,
          brokenImages: [...document.images]
            .filter(image => !image.complete || image.naturalWidth === 0)
            .map(image => image.getAttribute('src')),
          iframeCount: document.querySelectorAll('iframe').length,
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
      check(metrics.gamblingStills === 15, `${viewport.label} rendered gambling wall count is ${metrics.gamblingStills}, expected 15`);
      check(metrics.gamblingColumns === ({ desktop: 5, tablet: 3, mobile: 2 })[viewport.label], `${viewport.label} gambling wall has ${metrics.gamblingColumns} columns`);
      check(metrics.gamblingAltsComplete, `${viewport.label} gambling wall contains a blank alt attribute`);
      check(metrics.gamblingRatiosValid, `${viewport.label} gambling wall contains a tile that is not 16:9`);
      if (viewport.label === 'mobile') check(metrics.lastGamblingStillSpansWall, 'mobile final gambling still does not span the two-column wall');
      if (viewport.label === 'mobile') check(metrics.gamblingCopyLines === 1, `mobile gambling summary wraps to ${metrics.gamblingCopyLines} lines`);
      check(metrics.brokenImages.length === 0, `${viewport.label} has broken images: ${metrics.brokenImages.join(', ')}`);
      check(metrics.iframeCount === 0, `${viewport.label} initially contains ${metrics.iframeCount} iframe(s)`);
      check(!metrics.horizontalOverflow, `${viewport.label} has horizontal overflow`);
      check(metrics.forbidden.length === 0, `${viewport.label} renders forbidden text: ${metrics.forbidden.join(', ')}`);

      const modalChecks = viewport.label === 'desktop' ? 31 : 1;
      for (let index = 0; index < modalChecks; index += 1) {
        const expectedVideoId = works[index].videos[0].id;
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
        check(
          modalState.iframeSrc.includes(`/embed/${expectedVideoId}?`),
          `${viewport.label} work ${index + 1} opened the wrong video: ${modalState.iframeSrc}`
        );
        await page.locator('#video-close').click();
        const closedIframeCount = await page.locator('#video-frame iframe').count();
        check(closedIframeCount === 0, `${viewport.label} work ${index + 1} left an iframe after closing`);
      }

      await page.locator('#quick-open').click();
      check(await page.locator('#quick-dialog').evaluate(node => node.open), `${viewport.label} quick dialog did not open`);
      const initialQuickTitle = await page.locator('#quick-title').textContent();
      await page.locator('#quick-lang-toggle').click();
      check(await page.locator('#quick-title').textContent() !== initialQuickTitle, `${viewport.label} quick language toggle did not update the open slide`);
      await page.locator('#quick-lang-toggle').click();
      await page.keyboard.press('End');
      check(await page.locator('#quick-progress').textContent() === '09 / 09', `${viewport.label} End key did not reach the final quick slide`);
      await page.keyboard.press('Home');
      check(await page.locator('#quick-progress').textContent() === '01 / 09', `${viewport.label} Home key did not return to the first quick slide`);
      await page.keyboard.press('ArrowRight');
      check(await page.locator('#quick-progress').textContent() === '02 / 09', `${viewport.label} ArrowRight did not advance the quick slide`);
      await page.keyboard.press('ArrowLeft');
      check(await page.locator('#quick-progress').textContent() === '01 / 09', `${viewport.label} ArrowLeft did not return the quick slide`);
      for (let index = 0; index < quickSlides.length; index += 1) {
        await page.locator('#quick-title').waitFor({ state: 'visible' });
        if (quickSlides[index].image) {
          await page.waitForFunction(() => {
            const image = document.querySelector('#quick-stage img');
            return Boolean(image?.complete && image.naturalWidth > 0);
          });
        }
        const quickMetrics = await page.evaluate((expectsImage) => {
          const title = document.querySelector('#quick-title');
          const dialog = document.querySelector('#quick-dialog');
          const image = document.querySelector('#quick-stage img');
          const titleBox = title?.getBoundingClientRect();
          return {
            titleVisible: Boolean(titleBox && titleBox.width > 0 && titleBox.height > 0),
            dialogOpen: Boolean(dialog?.open),
            badImage: expectsImage && (!image?.complete || image.naturalWidth === 0),
            horizontalOverflow: Boolean(dialog && dialog.scrollWidth > dialog.clientWidth),
            progress: document.querySelector('#quick-progress')?.textContent?.trim()
          };
        }, Boolean(quickSlides[index].image));
        check(quickMetrics.titleVisible, `${viewport.label} quick slide ${index + 1} title is not visible`);
        check(quickMetrics.dialogOpen, `${viewport.label} quick slide ${index + 1} dialog is not open`);
        check(!quickMetrics.badImage, `${viewport.label} quick slide ${index + 1} has an undecodable image`);
        check(!quickMetrics.horizontalOverflow, `${viewport.label} quick slide ${index + 1} has horizontal overflow`);
        check(quickMetrics.progress === `${String(index + 1).padStart(2, '0')} / 09`, `${viewport.label} quick slide ${index + 1} progress is incorrect`);
        if (index < quickSlides.length - 1) await page.locator('#quick-next').click();
      }
      check(await page.locator('#quick-next').isDisabled(), `${viewport.label} quick next control remains enabled on the final slide`);
      check(await page.locator('#quick-prev').isEnabled(), `${viewport.label} quick previous control is disabled on the final slide`);
      await page.locator('#quick-close').click();
      check(await page.locator('#video-frame iframe').count() === 0, `${viewport.label} quick close left a video iframe`);

      let quickModalChecks = 0;
      if (viewport.label === 'desktop') {
        for (let slideIndex = 0; slideIndex < quickSlides.length; slideIndex += 1) {
          const links = quickSlides[slideIndex].links || [];
          for (let linkIndex = 0; linkIndex < links.length; linkIndex += 1) {
            const expectedId = links[linkIndex].id;
            await page.locator('#quick-open').click();
            await page.locator('.quick-dot').nth(slideIndex).click();
            await page.locator('.quick-watch').nth(linkIndex).click();
            const quickVideoState = await page.evaluate(() => ({
              quickClosed: !document.querySelector('#quick-dialog')?.open,
              videoOpen: Boolean(document.querySelector('#video-dialog')?.open),
              iframeCount: document.querySelectorAll('#video-frame iframe').length,
              iframeSrc: document.querySelector('#video-frame iframe')?.getAttribute('src') || ''
            }));
            check(quickVideoState.quickClosed, `quick film ${expectedId} did not close the quick dialog`);
            check(quickVideoState.videoOpen, `quick film ${expectedId} did not open the existing video dialog`);
            check(quickVideoState.iframeCount === 1, `quick film ${expectedId} rendered ${quickVideoState.iframeCount} iframe(s)`);
            check(quickVideoState.iframeSrc.includes(`/embed/${expectedId}?`), `quick film ${expectedId} opened the wrong iframe: ${quickVideoState.iframeSrc}`);
            await page.locator('#video-close').click();
            check(await page.locator('#video-frame iframe').count() === 0, `quick film ${expectedId} left an iframe after closing`);
            quickModalChecks += 1;
          }
        }
        check(quickModalChecks === 14, `desktop checked ${quickModalChecks}/14 quick film entries`);
      }

      check(pageErrors.length === 0, `${viewport.label} page errors: ${pageErrors.join(' | ')}`);
      renderedViews.push({ ...viewport, ...metrics, modalChecks, quickModalChecks, pageErrors: pageErrors.length });
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
  const onlineVideoIds = [...new Set([...videoIds, ...expectedQuickVideoIds])];
  for (let offset = 0; offset < onlineVideoIds.length; offset += 6) {
    const batch = onlineVideoIds.slice(offset, offset + 6);
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
check(html.includes('id="gambling-wall"'), 'gambling screenshot wall is missing from index.html');
check(html.includes('GAMBLING COMMERCIALS'), 'approved gambling label is missing from index.html');
check(html.includes('mailto:hey.yuhsuncheng@gmail.com'), 'approved contact mailto is missing from index.html');
check(html.includes('id="quick-open"'), 'quick introduction CTA is missing from index.html');
check(html.includes('id="quick-dialog"'), 'quick introduction dialog is missing from index.html');
check(html.includes('id="quick-lang-toggle"'), 'quick introduction language control is missing from index.html');
check(css.includes('@media(max-width:680px)'), 'mobile breakpoint is missing');
check(css.includes('.gambling-wall'), 'gambling screenshot wall styles are missing');
check(css.includes('.quick-dialog'), 'quick introduction dialog styles are missing');
check(js.includes('youtube-nocookie.com/embed/'), 'privacy-enhanced YouTube embed is missing');
check(js.includes('window.location.hash'), 'hash navigation recovery is missing');
check(js.includes("event.key === 'ArrowLeft'") && js.includes("event.key === 'ArrowRight'") && js.includes("event.key === 'Home'") && js.includes("event.key === 'End'"), 'quick introduction keyboard navigation is incomplete');

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
  quickVideoIds: expectedQuickVideoIds.length,
  onlineUniqueVideoIds: new Set([...videoIds, ...expectedQuickVideoIds]).size,
  ordinarySelectedImages: assetManifest.items.filter(item => item.slug !== 'gambling-commercials').length,
  gamblingSelectedImages: assetManifest.gamblingWall.length,
  onlineVideoCheck: process.argv.includes('--online'),
  renderedCheck: process.argv.includes('--rendered'),
  renderedViews,
  imageAssets: images.size
}, null, 2));
