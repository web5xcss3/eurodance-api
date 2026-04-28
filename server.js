const express = require('express');
const cors = require('cors');

const app = express();

// ✅ CORS LIBERADO (OBRIGATÓRIO)
app.use(cors({
    origin: '*', // pode restringir depois
}));

// 🔐 CHAVE SEGURA (Render ENV)
const YOUTUBE_KEY = process.env.YOUTUBE_KEY;

// 🎬 ROTA
app.get('/youtube', async (req, res) => {

    const q = req.query.q || 'eurodance';

    try {

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(q)}&type=video&maxResults=12&key=${YOUTUBE_KEY}`
        );

        const data = await response.json();

        res.json(data);

    } catch (error) {

        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar vídeos' });

    }

});

// 🚀 START
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('API rodando');
});
