const express = require('express');
const cors = require('cors');

const app = express();

// ✅ CORS LIBERADO (ESSENCIAL)
app.use(cors());

// 🔐 ENV
const YOUTUBE_KEY = process.env.YOUTUBE_KEY;

// 🎬 ROTA
app.get('/youtube', async (req, res) => {

    const q = req.query.q || 'eurodance';

    try {

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(q)}&type=video&maxResults=12&key=${YOUTUBE_KEY}`
        );

        const data = await response.json();

        res.setHeader('Access-Control-Allow-Origin', '*'); // 🔥 força CORS
        res.json(data);

    } catch (error) {

        console.error('Erro backend:', error);
        res.status(500).json({ error: 'Erro ao buscar vídeos' });

    }

});

// 🔥 ROTA TESTE
app.get('/', (req, res) => {
    res.send('API OK');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('API rodando');
});
