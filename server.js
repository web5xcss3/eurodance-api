const express = require('express');
const cors = require('cors');

const albums = require('./data/albums.json');
const genres = require('./data/genres.json');
const instrumental = require('./data/instrumental.json');
const labels = require('./data/labels.json');
const mixdjs = require('./data/mixdj.json');
const music = require('./data/music.json');
const playlists = require('./data/playlists.json');
const single = require('./data/single.json');
const vinyl = require('./data/vinyl.json');

const app = express();

app.use(cors());
app.use(express.json());

const YOUTUBE_KEY = process.env.YOUTUBE_KEY;

const cache = {};
const CACHE_TIME = 1000 * 60 * 60;

// JSON routes
app.get('/albums', (req, res) => res.json(albums));
app.get('/genres', (req, res) => res.json(genres));
app.get('/instrumental', (req, res) => res.json(instrumental));
app.get('/labels', (req, res) => res.json(labels));
app.get('/mixdj', (req, res) => res.json(mixdjs));
app.get('/music', (req, res) => res.json(music));
app.get('/playlists', (req, res) => res.json(playlists));
app.get('/single', (req, res) => res.json(single));
app.get('/vinyl', (req, res) => res.json(vinyl));

// tudo junto
app.get('/mock', (req, res) => {
  res.json({
    albums,
    genres,
    instrumental,
    labels,
    mixdjs,
    music,
    playlists,
    single,
    vinyl
  });
});

// YouTube
app.get('/youtube', async (req, res) => {
  const q = req.query.q || 'eurodance';

  try {
    if (cache[q]) {
      const cacheAge = Date.now() - cache[q].time;

      if (cacheAge < CACHE_TIME) {
        return res.json(cache[q].data);
      }

      delete cache[q];
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(q)}&type=video&maxResults=12&key=${YOUTUBE_KEY}`
    );

    const data = await response.json();

    cache[q] = {
      data,
      time: Date.now()
    };

    res.json(data);
  } catch (error) {
    console.error('Erro backend:', error);
    res.status(500).json({ error: 'Erro ao buscar vídeos' });
  }
});

// teste
app.get('/', (req, res) => {
  res.json({
    status: 'API OK',
    routes: [
      '/albums',
      '/genres',
      '/instrumental',
      '/labels',
      '/mixdj',
      '/music',
      '/playlists',
      '/single',
      '/vinyl',
      '/mock',
      '/youtube?q=eurodance'
    ]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('API rodando');
});
