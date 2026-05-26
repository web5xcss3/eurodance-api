const multer = require('multer');
const FormData = require('form-data');

const upload = multer();
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
// ADMIN PROTEGIDO + IMGBB
// ===============================
app.post('/admin/create-item', upload.single('image'), async (req, res) => {

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      error: 'Não autorizado'
    });
  }

  try {

    const imageBase64 = req.file.buffer.toString('base64');

    const form = new FormData();

    form.append('image', imageBase64);

    // ENVIA PARA IMGBB
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_KEY}`,
      {
        method: 'POST',
        body: form
      }
    );

    const imageData = await response.json();

    // URL RETORNADA
    const imageUrl = imageData.data.url;

    // CRIA OBJETO
    const item = {
      id: Date.now(),

      type: req.body.type || 'albums',

      artist: req.body.artist || '',

      title: req.body.title || '',

      image: imageUrl,

      embedUrl: req.body.embedUrl || '',

      year: req.body.year || '',

      label: req.body.label || '',

      country: req.body.country || '',

      format: req.body.format || '',

      genre: req.body.genre || '',

      style: req.body.style || ''
    };

    console.log('✅ ITEM CRIADO');
    console.log(item);

    res.json({
      success: true,
      item
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Erro upload ImgBB'
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
      '/youtube?q=eurodance',
      '/admin/create-item'
    ]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('API rodando na porta ' + PORT);
});
