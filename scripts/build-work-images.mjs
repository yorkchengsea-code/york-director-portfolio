import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(siteRoot, '../../..');
const sharpEntry = path.join(
  workspaceRoot,
  '導演功課/導演作品集/全量版/node_modules/sharp/lib/index.js'
);
const sharp = (await import(pathToFileURL(sharpEntry).href)).default;
const outputDir = path.join(siteRoot, 'assets/works');
const gamblingWallOutputDir = path.join(siteRoot, 'assets/gambling-wall');
const manifestPath = path.resolve(siteRoot, '../website-refresh-2026-08-22-v2-asset-manifest.json');

const sources = [
  ['tea', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/茶裏王／客棧圍攻篇/frame-21-t15.350.png'],
  ['tianlong2', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/天龍八部 2/frame-192-t95.500.png'],
  ['shenmo', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/神魔傳說/frame-41-t20.000.png'],
  ['last-taoist', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/最後的道長/frame-69-t34.000.png'],
  ['qing-yu-nian', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/慶餘年/02_變身篇/frame-13-t6.000.png'],
  ['roucifang', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/王品肉次方/03_參之型／極鮮の瞬間・控溫斬/frame-10-t4.500.png'],
  ['schick', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/舒適牌 HydroPRO 磁浮刮鬍刀/frame-03-t10.500.png'],
  ['google-play', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/Google Play 台灣廣告／就差一點篇/frame-60-t25.000.png'],
  ['bawang', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/霸王之野望/frame-109-t54.500.png'],
  ['soul-land', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/斗羅大陸：獵魂世界/01_宗門集結篇/frame-23-t11.000.png'],
  ['xin-xianxia', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/新仙俠：起源／完整版/frame-80-t39.500.png'],
  ['lost-ark', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/失落的方舟/01_命運篇/frame-14-t6.500.png'],
  ['chaobao', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/超爆三國志/frame-59-t29.000.png'],
  ['yanyu', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/煙雨江湖/02_桃花篇/frame-21-t10.000.png'],
  ['kaitian', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/開天/frame-92-t45.500.png'],
  ['summoners-war', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/魔靈召喚/01_紅色按鈕篇/frame-50-t24.500.png'],
  ['ulala', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/不休的烏拉拉/frame-42-t20.500.png'],
  ['mirror-story', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/魔鏡物語/02_魔白雪篇/frame-51-t24.000.png'],
  ['new-ludingji', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/新鹿鼎記/frame-41-t20.000.png'],
  ['yujian', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/御劍神州/frame-160-t79.500.png'],
  ['asus', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/ASUS ZenBook Pro Duo/frame-14-t6.500.png'],
  ['godiva', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/GODIVA/frame-10-t4.500.png'],
  ['schick-cc', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/舒芙晶透煥亮 CC 刀/frame-21-t10.000.png'],
  ['gcs-2018', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/GCS 2018 夏季賽片頭/frame-101-t50.000.png'],
  ['lms-2018', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/LMS 2018 春季賽片頭/frame-77-t38.000.png'],
  ['earth-revival', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/星球重啟/01_種田當大佬篇/frame-27-t13.000.png'],
  ['street-basketball', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/街頭籃球2：正宗續作/01_默契主場篇/frame-01-t0.000.png'],
  ['hot-blooded-jianghu', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/熱血江湖：歸來/01_啦啦隊篇/frame-55-t27.000.png'],
  ['moji-story', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/魔姬物語/01_職場篇/frame-29-t14.000.png'],
  ['play-metropolis', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/玩賺大都會/frame-36-t17.500.png'],
  ['era-of-conquest', '導演功課/導演作品集/York挑圖_完整80案圖庫_2026-08-11/00_把喜歡的圖放這裡/文明與征服／全球大戰篇/frame-06-t2.500.png'],
  ['gambling-commercials', 'assets/gambling-dense-library-49-films/01_正式廣告主片/002_滿貫大亨_舞獅篇/frame-19-t9.000.png']
];

const gamblingWallSources = [
  ['01-manguan-lion', 'assets/gambling-dense-library-49-films/01_正式廣告主片/002_滿貫大亨_舞獅篇/frame-19-t9.000.png'],
  ['02-manguan-power-card', 'assets/gambling-dense-library-49-films/01_正式廣告主片/010_滿貫大亨911_神力卡篇/frame-19-t9.000.png'],
  ['03-manguan-dinner', 'assets/gambling-dense-library-49-films/01_正式廣告主片/011_滿貫大亨911_加菜篇/frame-11-t5.000.png'],
  ['04-manguan-speed-911-a', 'assets/gambling-dense-library-49-films/01_正式廣告主片/012_滿貫大亨911_急速玖壹壹篇/frame-15-t7.000.png'],
  ['05-manguan-speed-911-b', 'assets/gambling-dense-library-49-films/01_正式廣告主片/012_滿貫大亨911_急速玖壹壹篇/frame-19-t9.000.png'],
  ['06-jubao-blessing', 'assets/gambling-dense-library-49-films/01_正式廣告主片/013_聚寶online禮生團_開光篇/frame-02-t0.500.png'],
  ['07-jubao-all-come', 'assets/gambling-dense-library-49-films/01_正式廣告主片/014_聚寶online_攏總來篇/frame-19-t9.000.png'],
  ['08-ace-gold-a', 'assets/gambling-dense-library-49-films/01_正式廣告主片/030_王牌俱樂部_黃金在手篇/frame-07-t3.000.png'],
  ['09-ace-gold-b', 'assets/gambling-dense-library-49-films/01_正式廣告主片/030_王牌俱樂部_黃金在手篇/frame-11-t5.000.png'],
  ['10-baonifa-midautumn', 'assets/gambling-dense-library-49-films/01_正式廣告主片/034_包你發_中秋工地篇/frame-06-t2.500.png'],
  ['11-baonifa-worldcup', 'assets/gambling-dense-library-49-films/01_正式廣告主片/035_包你發_世足台灣隊篇/frame-05-t2.000.png'],
  ['12-goodluck-samba', 'assets/gambling-dense-library-49-films/01_正式廣告主片/037_金好運_森巴篇/frame-10-t4.500.png'],
  ['13-rich-motorcycle', 'assets/gambling-dense-library-49-films/01_正式廣告主片/038_老子有錢_機車篇/frame-18-t8.500.png'],
  ['14-rich-show-segment', 'assets/gambling-dense-library-49-films/01_正式廣告主片/039_老子有錢_節目橋段篇/frame-21-t10.000.png'],
  ['15-rich-sports-car', 'assets/gambling-dense-library-49-films/01_正式廣告主片/042_老子有錢_跑車篇/frame-22-t10.500.png']
];

const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(gamblingWallOutputDir, { recursive: true });
const manifest = [];

for (const [slug, relativeSource] of sources) {
  const source = path.join(workspaceRoot, relativeSource);
  const output = path.join(outputDir, `${slug}.webp`);
  const sourceBuffer = await fs.readFile(source);
  const sourceMeta = await sharp(sourceBuffer).metadata();
  await sharp(sourceBuffer)
    .rotate()
    .resize({ width: 1600, height: 1000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 5 })
    .toFile(output);
  const outputBuffer = await fs.readFile(output);
  const outputMeta = await sharp(outputBuffer).metadata();
  manifest.push({
    slug,
    source: relativeSource,
    sourceSha256: hash(sourceBuffer),
    output: path.relative(siteRoot, output).replaceAll('\\', '/'),
    outputSha256: hash(outputBuffer),
    width: outputMeta.width,
    height: outputMeta.height,
    sourceWidth: sourceMeta.width,
    sourceHeight: sourceMeta.height,
    bytes: outputBuffer.length
  });
}

const gamblingWallManifest = [];
for (const [slug, relativeSource] of gamblingWallSources) {
  const source = path.join(workspaceRoot, relativeSource);
  const output = path.join(gamblingWallOutputDir, `${slug}.webp`);
  const sourceBuffer = await fs.readFile(source);
  const sourceMeta = await sharp(sourceBuffer).metadata();
  await sharp(sourceBuffer)
    .rotate()
    .resize({ width: 960, height: 540, fit: 'cover', position: 'centre', withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toFile(output);
  const outputBuffer = await fs.readFile(output);
  const outputMeta = await sharp(outputBuffer).metadata();
  gamblingWallManifest.push({
    slug,
    source: relativeSource,
    sourceSha256: hash(sourceBuffer),
    output: path.relative(siteRoot, output).replaceAll('\\', '/'),
    outputSha256: hash(outputBuffer),
    width: outputMeta.width,
    height: outputMeta.height,
    sourceWidth: sourceMeta.width,
    sourceHeight: sourceMeta.height,
    bytes: outputBuffer.length
  });
}

const ogPath = path.join(siteRoot, 'assets/og-york-director.jpg');
const ogPhoto = await sharp(path.join(outputDir, 'tea.webp'))
  .resize(760, 630, { fit: 'cover', position: 'centre' })
  .modulate({ saturation: 0.82 })
  .toBuffer();
const ogType = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <rect width="440" height="630" fill="#f3f3f0"/>
    <rect x="440" width="760" height="630" fill="none"/>
    <text x="42" y="104" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="3" fill="#777772">DIRECTOR PORTFOLIO</text>
    <text x="36" y="240" font-family="Arial Black, Arial, sans-serif" font-size="88" font-weight="900" letter-spacing="-6" fill="#11120f">YORK</text>
    <text x="36" y="324" font-family="Arial Black, Arial, sans-serif" font-size="88" font-weight="900" letter-spacing="-6" fill="#11120f">CHENG</text>
    <text x="42" y="374" font-family="Microsoft JhengHei, Arial, sans-serif" font-size="20" letter-spacing="5" fill="#777772">鄭又勛／導演</text>
    <line x1="42" y1="440" x2="394" y2="440" stroke="#c9c9c3" stroke-width="1"/>
    <text x="42" y="500" font-family="Arial, sans-serif" font-size="11" letter-spacing="1" fill="#777772">GAME ADVERTISING · COMMERCIAL FILM</text>
    <text x="42" y="522" font-family="Arial, sans-serif" font-size="11" letter-spacing="1" fill="#777772">LIVE ACTION · CG · AI FILM</text>
    <rect x="440" y="0" width="760" height="630" fill="url(#shade)"/>
    <defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient></defs>
    <text x="1160" y="588" text-anchor="end" font-family="Arial, sans-serif" font-size="11" letter-spacing="1" fill="#f3f3f0">YORK CHENG / DIRECTOR</text>
  </svg>
`);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#11120f' } })
  .composite([{ input: ogPhoto, left: 440, top: 0 }, { input: ogType, left: 0, top: 0 }])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(ogPath);
const ogBuffer = await fs.readFile(ogPath);

await fs.writeFile(manifestPath, JSON.stringify({
  schema: 'york-website-image-build-v2',
  items: manifest,
  gamblingWall: gamblingWallManifest,
  socialPreview: {
    output: 'assets/og-york-director.jpg',
    outputSha256: hash(ogBuffer),
    width: 1200,
    height: 630,
    bytes: ogBuffer.length
  }
}, null, 2));
console.log(JSON.stringify({
  built: manifest.length,
  gamblingWallBuilt: gamblingWallManifest.length,
  outputDir,
  gamblingWallOutputDir,
  ogPath,
  manifestPath
}, null, 2));
