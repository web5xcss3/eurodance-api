const fs = require('fs');
const path = require('path');
const multer = require('multer');

const upload = multer();

const adminItemsPath = path.join(__dirname, 'data', 'adminItems.json');

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

// NOVA ROTA
app.get('/adminItems', (req, res) => {

  try {

    if (!fs.existsSync(adminItemsPath)) {
      fs.writeFileSync(adminItemsPath, '[]');
    }

    const items = JSON.parse(
      fs.readFileSync(adminItemsPath, 'utf8')
    );

    res.json(items);

  } catch (error) {

    console.error('Erro ao ler adminItems:', error);

    res.status(500).json({
      error: 'Erro ao carregar adminItems'
    });
  }

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
// ADMIN PROTEGIDO + IMGBB + SAVE JSON
// ===============================
app.post(
  '/admin/create-item',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'artistImage', maxCount: 1 }
  ]),
  async (req, res) => {

    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({
        error: 'Não autorizado'
      });
    }

    try {
      const albumFile = req.files?.image?.[0];
      const artistFile = req.files?.artistImage?.[0];

      if (!albumFile || !albumFile.buffer) {
        return res.status(400).json({
          error: 'Nenhuma imagem de capa recebida pela API'
        });
      }

      async function uploadToImgBB(file) {
        const imageBlob = new Blob([file.buffer], {
          type: file.mimetype || 'image/jpeg'
        });

        const form = new globalThis.FormData();

        form.append(
          'image',
          imageBlob,
          file.originalname || 'upload.jpg'
        );

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_KEY}`,
          {
            method: 'POST',
            body: form
          }
        );

        const imageData = await response.json();

        if (!response.ok || !imageData.success || !imageData.data) {
          throw new Error(
            imageData?.error?.message || 'Erro upload ImgBB'
          );
        }

        return imageData.data.url;
      }

      const imageUrl = await uploadToImgBB(albumFile);

      let artistImageUrl = '';

      if (artistFile && artistFile.buffer) {
        artistImageUrl = await uploadToImgBB(artistFile);
      }

      const item = {
        id: Date.now(),
        type: req.body.type || 'albums',
        artist: req.body.artist || '',
        artistImage: artistImageUrl,
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

      if (!fs.existsSync(adminItemsPath)) {
        fs.writeFileSync(adminItemsPath, '[]');
      }

      let adminItems = [];

      try {
        adminItems = JSON.parse(fs.readFileSync(adminItemsPath, 'utf8'));
      } catch (error) {
        adminItems = [];
      }

      adminItems.unshift(item);

      fs.writeFileSync(
        adminItemsPath,
        JSON.stringify(adminItems, null, 2)
      );

      res.json({
        success: true,
        item
      });

    } catch (error) {
      console.error('ERRO ADMIN:', error);

      res.status(500).json({
        error: error.message || 'Erro ao criar item'
      });
    }
  }
);

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
