const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// 🔥 CORS LIBERADO
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/youtube', async (req, res) => {

    const query = req.query.q || 'eurodance';
    const API_KEY = process.env.YOUTUBE_KEY;

    try {

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=12&key=${API_KEY}`
        );

        const data = await response.json();

        res.json(data);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

app.listen(PORT, () => {
    console.log('API rodando');
});
