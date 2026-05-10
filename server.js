const express = require('express');
const cors = require('cors');

const mockData = require('./data/mockData.json');
const labels = require('./data/labels.json');
const genres = require('./data/genres.json');

const app = express();

app.use(cors());
app.use(express.json());

const YOUTUBE_KEY = process.env.YOUTUBE_KEY;

const cache = {};
const CACHE_TIME = 1000 * 60 * 60;

// ===============================
// JSON ROUTES
// ===============================
app.get('/mockData', (req, res) => {
  res.json(mockData);
});

app.get('/mock', (req, res) => {
  res.json(mockData);
});

app.get('/labels', (req, res) => {
  res.json(labels);
});

app.get('/genres', (req, res) => {
  res.json(genres);
});

// ===============================
// YOUTUBE
// ===============================
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
    res.status(500).json({
      error: 'Erro ao buscar vídeos'
    });
  }
});

// ===============================
// TESTE
// ===============================
app.get('/', (req, res) => {
  res.json({
    status: 'API OK',
    routes: [
      '/mockData',
      '/mock',
      '/labels',
      '/genres',
      '/youtube?q=eurodance'
    ]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('API rodando na porta ' + PORT);
});
