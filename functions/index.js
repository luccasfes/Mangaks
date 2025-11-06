const functions = require('firebase-functions');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// URLs da API do MangaDex
const API_URL = 'https://api.mangadex.org';
const COVER_URL = 'https://uploads.mangadex.org';

// Este 'app' tem todas as suas rotas (ex: /latest, /popular)
const app = express();
app.use(express.json());

// --- ROTAS DO SEU 'app' ---
// (Copiado de api/index.js)

app.get('/', (req, res) => {
    res.send('Servidor de Mangá rodando!');
});

app.get('/genre/:genre', async (req, res) => {
    const { genre } = req.params;
    const targetUrl = `${API_URL}/manga?includedTags[]=${genre}&availableTranslatedLanguage[]=pt-br&includes[]=cover_art&limit=30&order[followedCount]=desc`;
    try {
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

app.get('/popular', async (req, res) => {
    const targetUrl = `${API_URL}/manga?order[followedCount]=desc&availableTranslatedLanguage[]=pt-br&includes[]=cover_art&limit=30`;
    try {
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

app.get('/latest', async (req, res) => {
    const targetUrl = `${API_URL}/manga?order[latestUploadedChapter]=desc&availableTranslatedLanguage[]=pt-br&includes[]=cover_art&limit=30`;
    try {
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

app.get('/cover/:mangaId/:coverFileName', async (req, res) => {
    const { mangaId, coverFileName } = req.params;
    const coverUrl = `${COVER_URL}/covers/${mangaId}/${coverFileName}.256.jpg`; 
    try {
        const response = await axios.get(coverUrl, { responseType: 'arraybuffer' });
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        res.status(404).send('Capa não encontrada');
    }
});

app.get('/search', async (req, res) => {
    const query = req.query.q; 
    if (!query) {
        return res.status(400).json({ error: 'Termo de busca (q) é obrigatório' });
    }
    const targetUrl = `${API_URL}/manga?title=${encodeURIComponent(query)}&includes[]=cover_art&availableTranslatedLanguage[]=pt-br`;
    try {
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

app.get('/chapters/:mangaId', async (req, res) => {
    const { mangaId } = req.params;
    const targetUrl = `${API_URL}/manga/${mangaId}/feed?translatedLanguage[]=pt-br&order[chapter]=asc`;
    try {
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

app.get('/reader/:chapterId', async (req, res) => {
    const { chapterId } = req.params;
    const targetUrl = `${API_URL}/at-home/server/${chapterId}`;
    try {
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

// --- FIM DAS ROTAS ---

// Crie um "main" app que o Firebase vai usar
const main = express();

// Aplique o CORS no app principal
main.use(cors());

// Diga ao 'main' para usar o seu 'app' antigo, mas no caminho '/api'
main.use('/api', app);

// Exporte o 'main' app para o Firebase
exports.api = functions.https.onRequest(main);