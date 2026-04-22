// =====================================================
// CONFIG
// =====================================================
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// pega a API do ambiente (Render)
const YOUTUBE_KEY = process.env.YOUTUBE_KEY;

// =====================================================
// TESTE
// =====================================================
app.get('/', (req, res) => {
    res.send('🚀 Eurodance API online!');
});

// =====================================================
// YOUTUBE PROXY
// =====================================================
app.get('/youtube', async (req, res) => {
    try {
        const query = req.query.q || 'eurodance';

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=12&key=${YOUTUBE_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);

    } catch (err) {
        console.error('Erro YouTube:', err);
        res.status(500).json({ error: 'Erro ao buscar vídeos' });
    }
});

// =====================================================
// START
// =====================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🔥 Server rodando na porta ${PORT}`);
});
