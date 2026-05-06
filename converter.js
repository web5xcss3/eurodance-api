const fs = require('fs');
const path = require('path');

const mockFeatured = require('./mockFeatured');

const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const albums = [];
const singles = [];
const vinyls = [];
const djs = [];
const instrumental = [];
const musics = [];
const others = [];

mockFeatured.forEach(item => {
  const format = (item.format || '').toLowerCase();
  const title = (item.title || '').toLowerCase();

  if (format.includes('album')) {
    albums.push(item);
  } else if (format.includes('maxi-single') || format.includes('single')) {
    singles.push(item);
  } else if (format.includes('vinyl') || format.includes('viny')) {
    vinyls.push(item);
  } else if (format.includes('dj') || title.includes('dj')) {
    djs.push(item);
  } else if (format.includes('instrumental') || title.includes('instrumental')) {
    instrumental.push(item);
  } else if (format.includes('music') || format.includes('song')) {
    musics.push(item);
  } else {
    others.push(item);
  }
});

function saveJson(filename, data) {
  fs.writeFileSync(
    path.join(dataDir, filename),
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

saveJson('featured.json', mockFeatured);
saveJson('albums.json', albums);
saveJson('singles.json', singles);
saveJson('vinyls.json', vinyls);
saveJson('djs.json', djs);
saveJson('instrumental.json', instrumental);
saveJson('musics.json', musics);
saveJson('others.json', others);

console.log('Conversão concluída!');
console.log('Featured:', mockFeatured.length);
console.log('Albums:', albums.length);
console.log('Singles:', singles.length);
console.log('Vinyls:', vinyls.length);
console.log('DJs:', djs.length);
console.log('Instrumental:', instrumental.length);
console.log('Musics:', musics.length);
console.log('Others:', others.length);