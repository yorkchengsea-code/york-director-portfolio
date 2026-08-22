import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const data = JSON.parse(await read('site-data.json'));
const html = await read('index.html');
const css = await read('css/style.css');
const js = await read('js/script.js');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(data.flagship.length === 8, 'flagship must contain 8 works');
check(data.selected.length === 12, 'selected must contain 12 works');
check(data.additional.length === 12, 'additional must contain 12 works');
check(data.archive.length === 6, 'archive must contain 6 groups');
check(data.archive.flatMap(group => group.works).length === 26, 'archive must contain 26 works');
check(data.gambling.films === '49', 'gambling collection must contain 49 films');

const titleSet = new Set([
  ...data.flagship.map(work => work.title_zh),
  ...data.selected.map(work => work.title_zh),
  ...data.additional.map(work => work.title_zh),
  ...data.archive.flatMap(group => group.works)
]);
check(titleSet.size === 58, `filmography must contain 58 unique works, found ${titleSet.size}`);

const publicText = [html, JSON.stringify(data), css, js].join('\n');
for (const forbidden of ['_removed_works', 'views_note', '1982478', '2390008', '88+', '一手包辦', '王依淳']) {
  check(!publicText.includes(forbidden), `public source contains forbidden token: ${forbidden}`);
}

const works = data.flagship.concat(data.selected, data.additional);
const images = new Set([
  ...works.map(work => work.image),
  ...data.archive.map(group => group.image),
  ...data.gambling.images,
  'assets/portrait.jpg',
  'assets/og-york-director.jpg'
]);
for (const image of images) {
  try {
    const stat = await fs.stat(path.join(root, image));
    check(stat.size > 1000, `image is unexpectedly small: ${image}`);
  } catch {
    failures.push(`missing image: ${image}`);
  }
}

const videoIds = works.flatMap(work => work.videos || []).map(video => video.id);
check(videoIds.length === 37, `expected 37 public video embeds, found ${videoIds.length}`);
for (const id of videoIds) check(/^[A-Za-z0-9_-]{11}$/.test(id), `invalid YouTube id: ${id}`);

if (process.argv.includes('--online')) {
  const uniqueVideoIds = [...new Set(videoIds)];
  for (let offset = 0; offset < uniqueVideoIds.length; offset += 6) {
    const batch = uniqueVideoIds.slice(offset, offset + 6);
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
check(css.includes('@media(max-width:680px)'), 'mobile breakpoint is missing');
check(js.includes('youtube-nocookie.com/embed/'), 'privacy-enhanced YouTube embed is missing');
check(js.includes('window.location.hash'), 'hash navigation recovery is missing');

if (failures.length) {
  console.error(JSON.stringify({ status: 'FAIL', failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  flagship: data.flagship.length,
  selected: data.selected.length,
  additional: data.additional.length,
  archiveWorks: data.archive.flatMap(group => group.works).length,
  uniqueWorks: titleSet.size,
  videoEmbeds: videoIds.length,
  onlineVideoCheck: process.argv.includes('--online'),
  imageAssets: images.size
}, null, 2));
