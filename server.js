const express = require('express');

const app = express();

app.get('/youtube', async (req, res) => {

    const q = req.query.q || 'eurodance';
    const key = process.env.YOUTUBE_KEY;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=12&key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        res.json(data);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

console.log("KEY:", process.env.YOUTUBE_KEY);

app.listen(3000, () => console.log('API rodando'));
