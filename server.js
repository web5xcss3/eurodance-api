const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

const YOUTUBE_KEY = process.env.YOUTUBE_KEY;

app.get('/api/youtube', async (req, res) => {

    const query = req.query.q || 'eurodance';

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=12&key=${YOUTUBE_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);

    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar vídeos' });
    }

});

app.listen(3000, () => {
    console.log('API rodando');
});
