const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

// URLs da API do MangaDex
const API_URL = 'https://api.mangadex.org';
const COVER_URL = 'https://uploads.mangadex.org';

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Rotas (Endpoints) ---

app.get('/', (req, res) => {
    res.send('Servidor de Mangá rodando!');
});

/**
 * Rota para buscar por gênero/categoria
 */
app.get('/genre/:genre', async (req, res) => {
    const { genre } = req.params;
    console.log(`Recebido pedido em /genre/${genre}`);
    
    try {
        const targetUrl = `${API_URL}/manga?includedTags[]=${genre}&availableTranslatedLanguage[]=pt-br&includes[]=cover_art&limit=30&order[followedCount]=desc`;
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        console.error(`Erro ao buscar /genre/${genre}:`, error.message);
        res.status(500).json({ error: 'Erro ao buscar dados do MangaDex' });
    }
});

/**
 * Rota para buscar mangás populares
 */
app.get('/popular', async (req, res) => {
    console.log('Recebido pedido em /popular');
    try {
        const targetUrl = `${API_URL}/manga?order[followedCount]=desc&availableTranslatedLanguage[]=pt-br&includes[]=cover_art&limit=30`;
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar /popular:', error.message);
        res.status(500).json({ error: 'Erro ao buscar dados do MangaDex' });
    }
});

// ... (mantenha as outras rotas existentes: latest, cover, search, chapters, reader)

app.get('/latest', async (req, res) => {
    console.log('Recebido pedido em /latest');
    try {
        const targetUrl = `${API_URL}/manga?order[latestUploadedChapter]=desc&availableTranslatedLanguage[]=pt-br&includes[]=cover_art&limit=30`;
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar /latest:', error.message);
        res.status(500).json({ error: 'Erro ao buscar dados do MangaDex' });
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
        console.error(`Erro ao buscar capa ${coverFileName} para ${mangaId}:`, error.message);
        res.status(404).send('Capa não encontrada');
    }
});

app.get('/search', async (req, res) => {
    const query = req.query.q; 
    console.log(`Recebido pedido em /search com o termo: ${query}`);

    if (!query) {
        return res.status(400).json({ error: 'Termo de busca (q) é obrigatório' });
    }

    try {
        const targetUrl = `${API_URL}/manga?title=${encodeURIComponent(query)}&includes[]=cover_art&availableTranslatedLanguage[]=pt-br`;
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        console.error(`Erro ao buscar /search com o termo ${query}:`, error.message);
        res.status(500).json({ error: 'Erro ao buscar dados do MangaDex' });
    }
});

app.get('/chapters/:mangaId', async (req, res) => {
    const { mangaId } = req.params;
    console.log(`Recebido pedido em /chapters para o mangá: ${mangaId}`);

    try {
        const targetUrl = `${API_URL}/manga/${mangaId}/feed?translatedLanguage[]=pt-br&order[chapter]=asc`;
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        console.error(`Erro ao buscar capítulos para o mangá ${mangaId}:`, error.message);
        res.status(500).json({ error: 'Erro ao buscar dados do MangaDex' });
    }
});

app.get('/reader/:chapterId', async (req, res) => {
    const { chapterId } = req.params;
    console.log(`Recebido pedido em /reader para o capítulo: ${chapterId}`);

    try {
        const targetUrl = `${API_URL}/at-home/server/${chapterId}`;
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        console.error(`Erro ao buscar dados do leitor para o capítulo ${chapterId}:`, error.message);
        res.status(500).json({ error: 'Erro ao buscar dados do MangaDex' });
    }
});

module.exports = app;