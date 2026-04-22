const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const YOUTUBE_KEY = process.env.YOUTUBE_KEY;

// TESTE
app.get('/', (req, res) => {
    res.send('API rodando 🚀');
});

// 🔥 ROTA YOUTUBE (ESSA FALTAVA)
app.get('/youtube', async (req, res) => {

    try {

        const query = req.query.q || 'eurodance';

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=12&key=${YOUTUBE_KEY}`;

        const response = await axios.get(url);

        res.json(response.data);

    } catch (error) {

        console.error(error.message);
        res.status(500).json({ error: 'Erro ao buscar vídeos' });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('API rodando na porta ' + PORT);
});
