const express = require('express');
const cors = require('cors');

const app = express();

// ✅ CORS
app.use(cors());

// 🔐 ENV
const YOUTUBE_KEY = process.env.YOUTUBE_KEY;

// 🧠 CACHE EM MEMÓRIA
const cache = {};
const CACHE_TIME = 1000 * 60 * 60; // 1 hora

// 🎬 ROTA COM CACHE
app.get('/youtube', async (req, res) => {

    const q = req.query.q || 'eurodance';

    try {

        // 🔥 VERIFICA CACHE
        if (cache[q]) {

            const cacheAge = Date.now() - cache[q].time;

            if (cacheAge < CACHE_TIME) {
                console.log('⚡ CACHE HIT:', q);

                return res.json(cache[q].data);
            } else {
                console.log('🗑️ CACHE EXPIRADO:', q);
                delete cache[q];
            }
        }

        console.log('🌐 BUSCANDO NA API:', q);

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(q)}&type=video&maxResults=12&key=${YOUTUBE_KEY}`
        );

        const data = await response.json();

        // 🔥 SALVA NO CACHE
        cache[q] = {
            data: data,
            time: Date.now()
        };

        res.json(data);

    } catch (error) {

        console.error('Erro backend:', error);

        res.status(500).json({ error: 'Erro ao buscar vídeos' });

    }

});

// 🔥 TESTE
app.get('/', (req, res) => {
    res.send('API OK');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('API rodando');
});
