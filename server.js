const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { MongoClient } = require('mongodb');

const mockData = require('./data/mockData.json');
const labels = require('./data/labels.json');
const genres = require('./data/genres.json');

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const YOUTUBE_KEY = process.env.YOUTUBE_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

const mongoClient = new MongoClient(MONGODB_URI, {
  tls: true,
  serverSelectionTimeoutMS: 10000
});
let adminCollection;

async function connectMongo() {
  if (adminCollection) return adminCollection;

  await mongoClient.connect();

  const db = mongoClient.db('play90');
  adminCollection = db.collection('adminItems');

  console.log('✅ MongoDB conectado');

  return adminCollection;
}

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
// ADMIN ITEMS MONGODB
// ===============================
app.get('/adminItems', async (req, res) => {
  try {
    const collection = await connectMongo();

    const items = await collection
      .find({})
      .sort({ id: -1 })
      .toArray();

    res.json(items);

  } catch (error) {
    console.error('Erro Mongo adminItems:', error);

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
// ADMIN PROTEGIDO + IMGBB + MONGODB
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

      const collection = await connectMongo();

      await collection.insertOne(item);

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
// ADMIN DELETE ITEM
// ===============================
app.delete('/admin/delete-item/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      error: 'Não autorizado'
    });
  }

  try {
    const id = parseInt(req.params.id, 10);

    const collection = await connectMongo();

    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Item não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Item removido com sucesso',
      id
    });

  } catch (error) {
    console.error('Erro ao deletar item:', error);

    res.status(500).json({
      error: 'Erro ao deletar item'
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
      '/adminItems',
      '/youtube?q=eurodance',
      '/admin/create-item'
    ]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('API rodando na porta ' + PORT);
});
