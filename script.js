// URL base do nosso próprio servidor
const SERVER_URL = window.location.hostname === 'localhost' ? '/api' : '/api';

// Elementos do HTML
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const categoriesMenu = document.getElementById('categoriesMenu');

// Áreas de Conteúdo Principal
const contentTitleContainer = document.getElementById('content-title-container');
const contentContainer = document.getElementById('content-container');

// Área de Capítulos
const chapterContainer = document.getElementById('chapter-container');
const backToSearchButton = document.getElementById('backToSearchButton');
const chapterMangaTitle = document.getElementById('chapter-manga-title');
const chapterListElement = document.getElementById('chapter-list');

// Área do Leitor
const readerContainer = document.getElementById('reader-container');
const backToChaptersButton = document.getElementById('backToChaptersButton');
const readerChapterTitle = document.getElementById('reader-chapter-title');
const readerImagesContainer = document.getElementById('reader-images-container');

// (NOVOS) Elementos de Navegação do Leitor
const prevChapterBtn = document.getElementById('prevChapterBtn');
const nextChapterBtn = document.getElementById('nextChapterBtn');
const chapterSelect = document.getElementById('chapterSelect');
const prevChapterBtnBottom = document.getElementById('prevChapterBtnBottom');
const nextChapterBtnBottom = document.getElementById('nextChapterBtnBottom');


// (NOVOS) Variáveis de estado para navegação
let currentMangaChapterList = []; // Guarda a lista de capítulos do mangá atual
let currentChapterIndex = 0; // Guarda o índice do capítulo que estamos lendo

// Mapeamento de gêneros para IDs do MangaDex
const GENRE_MAP = {
    'shounen': '391b0423-d847-456f-aff0-8b0cfc03066b',
    'action': '391b0423-d847-456f-aff0-8b0cfc03066b',
    'fantasy': 'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
    'romance': '423e2eae-a7a2-4a8b-ac03-a8351462d71d',
    'comedy': '4d32cc48-9f00-4cca-9b5a-a839fce4983b',
    'horror': 'cdad7e68-1419-41dd-bdce-27753074a640'
};

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    loadLatestReleases();
    setupCategoryButtons();
});

searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

backToSearchButton.addEventListener('click', () => {
    showSection('content');
});

backToChaptersButton.addEventListener('click', () => {
    showSection('chapters');
});

// (NOVOS) Listeners para navegação do leitor
prevChapterBtn.addEventListener('click', navigateToPreviousChapter);
nextChapterBtn.addEventListener('click', navigateToNextChapter);
prevChapterBtnBottom.addEventListener('click', navigateToPreviousChapter);
nextChapterBtnBottom.addEventListener('click', navigateToNextChapter);

chapterSelect.addEventListener('change', (e) => {
    const newIndex = parseInt(e.target.value, 10);
    navigateToChapter(newIndex);
});


// --- Funções de Navegação ---

function showSection(section) {
    // Esconde todas as seções
    contentTitleContainer.classList.add('hidden');
    contentContainer.classList.add('hidden');
    chapterContainer.classList.add('hidden');
    readerContainer.classList.add('hidden');
    
    // Mostra a seção especificada
    switch(section) {
        case 'content':
            contentTitleContainer.classList.remove('hidden');
            contentContainer.classList.remove('hidden');
            break;
        case 'chapters':
            chapterContainer.classList.remove('hidden');
            break;
        case 'reader':
            readerContainer.classList.remove('hidden');
            break;
    }
    
    window.scrollTo(0, 0);
}

function setupCategoryButtons() {
    const categoryButtons = categoriesMenu.querySelectorAll('.menu-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe active de todos os botões
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona a classe active ao botão clicado
            button.classList.add('active');
            
            // --- (A CORREÇÃO ESTÁ AQUI) ---
            // Força a volta para a tela de conteúdo principal
            showSection('content'); 
            // --- Fim da correção ---

            const category = button.dataset.category;
            loadCategory(category);
        });
    });
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        searchManga(query);
    }
}

// --- Funções da API ---

async function loadLatestReleases() {
    setLoadingState(true);
    try {
        const response = await fetch(`${SERVER_URL}/latest`);
        if (!response.ok) throw new Error('Falha na resposta do servidor');
        const data = await response.json();
        displayMangaList(data.data, "📚 Últimos Lançamentos PT-BR");
    } catch (error) {
        console.error('Erro ao carregar últimos lançamentos:', error);
        showError('Erro ao carregar lançamentos. Tente novamente.');
    } finally {
        setLoadingState(false);
    }
}

async function loadPopular() {
    setLoadingState(true);
    try {
        const response = await fetch(`${SERVER_URL}/popular`);
        if (!response.ok) throw new Error('Falha na resposta do servidor');
        const data = await response.json();
        displayMangaList(data.data, "🔥 Mangás Populares");
    } catch (error) {
        console.error('Erro ao carregar mangás populares:', error);
        showError('Erro ao carregar mangás populares. Tente novamente.');
    } finally {
        setLoadingState(false);
    }
}

async function loadCategory(category) {
    setLoadingState(true);
    
    try {
        let data;
        if (category === 'latest') {
            await loadLatestReleases();
            return;
        } else if (category === 'popular') {
            await loadPopular();
            return;
        } else {
            const genreId = GENRE_MAP[category];
            if (!genreId) {
                showError('Categoria não encontrada');
                return;
            }
            
            const response = await fetch(`${SERVER_URL}/genre/${genreId}`);
            if (!response.ok) throw new Error('Falha na resposta do servidor');
            data = await response.json();
            
            const categoryNames = {
                'shounen': '⚡ Shounen',
                'action': '💥 Ação',
                'fantasy': '🧙 Fantasia',
                'romance': '💖 Romance',
                'comedy': '😂 Comédia',
                'horror': '👻 Horror'
            };
            
            displayMangaList(data.data, categoryNames[category]);
        }
    } catch (error) {
        console.error(`Erro ao carregar categoria ${category}:`, error);
        showError('Erro ao carregar categoria. Tente novamente.');
    } finally {
        setLoadingState(false);
    }
}

async function searchManga(query) {
    setLoadingState(true);
    try {
        const response = await fetch(`${SERVER_URL}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Falha na resposta da rede');
        const data = await response.json();
        displayMangaList(data.data, `🔍 Resultados para "${query}"`);
    } catch (error) {
        console.error('Erro ao buscar mangá:', error);
        showError('Erro ao buscar mangás. Tente novamente.');
    } finally {
        setLoadingState(false);
    }
}

function displayMangaList(mangaList, titleText) {
    contentContainer.innerHTML = '';
    contentTitleContainer.innerHTML = `<h2>${titleText}</h2>`;

    if (!mangaList || mangaList.length === 0) {
        contentContainer.innerHTML = '<p class="loading-text">Nenhum mangá encontrado.</p>';
        return;
    }

    mangaList.forEach(manga => {
        let coverFileName = '';
        const coverRel = manga.relationships.find(rel => rel.type === 'cover_art');
        if (coverRel && coverRel.attributes) {
            coverFileName = coverRel.attributes.fileName;
        }

        const coverUrl = coverFileName 
            ? `${SERVER_URL}/cover/${manga.id}/${coverFileName}` 
            : 'https://via.placeholder.com/180x250.png?text=Sem+Capa';

        const title = manga.attributes.title.en || manga.attributes.title[Object.keys(manga.attributes.title)[0]] || 'Título Desconhecido';

        const card = document.createElement('div');
        card.className = 'manga-card';
        card.innerHTML = `
            <img src="${coverUrl}" alt="Capa de ${title}" loading="lazy">
            <h3>${title}</h3>
        `;
        
        card.addEventListener('click', () => {
            loadChapters(manga.id, title);
        });
        
        contentContainer.appendChild(card);
    });
}

async function loadChapters(mangaId, mangaTitle) {
    setLoadingState(true, 'chapters');
    showSection('chapters');
    chapterMangaTitle.innerText = mangaTitle;
    chapterListElement.innerHTML = '<p class="loading-text">Carregando capítulos...</p>';
    currentMangaChapterList = []; // Limpa a lista antiga

    try {
        const response = await fetch(`${SERVER_URL}/chapters/${mangaId}`);
        if (!response.ok) throw new Error('Falha ao buscar capítulos');
        const data = await response.json();
        displayChapters(data.data);
    } catch (error) {
        console.error('Erro ao carregar capítulos:', error);
        chapterListElement.innerHTML = '<p class="loading-text" style="color: #ff6b6b;">Erro ao carregar capítulos.</p>';
    } finally {
        setLoadingState(false);
    }
}

function displayChapters(chapterList) {
    chapterListElement.innerHTML = '';

    if (!chapterList || chapterList.length === 0) {
        chapterListElement.innerHTML = '<p class="loading-text">Nenhum capítulo PT-BR encontrado.</p>';
        return;
    }

    // Ordena capítulos numericamente
    const sortedChapters = chapterList.sort((a, b) => parseFloat(a.attributes.chapter) - parseFloat(b.attributes.chapter));
    currentMangaChapterList = sortedChapters; // (NOVO) Salva a lista ordenada

    sortedChapters.forEach((chapter, index) => {
        let chapNum = chapter.attributes.chapter;
        let chapTitle = chapter.attributes.title;
        let displayText = `Capítulo ${chapNum}`;
        if (chapTitle) {
            displayText += `: ${chapTitle}`;
        }

        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-item';
        chapterDiv.innerText = displayText;

        chapterDiv.addEventListener('click', () => {
            // (MUDANÇA) Passa o índice para o leitor
            loadReader(chapter.id, displayText, index);
        });

        chapterListElement.appendChild(chapterDiv);
    });
}

async function loadReader(chapterId, chapterTitle, index) {
    setLoadingState(true, 'reader');
    showSection('reader');
    readerChapterTitle.innerText = chapterTitle;
    readerImagesContainer.innerHTML = '<p class="loading-text">Carregando páginas...</p>';
    
    currentChapterIndex = index; // (NOVO) Atualiza o índice atual

    try {
        const response = await fetch(`${SERVER_URL}/reader/${chapterId}`);
        if (!response.ok) throw new Error('Falha ao buscar o servidor do capítulo');
        const data = await response.json();
        
        // (NOVO) Configura a navegação antes de mostrar as imagens
        setupReaderNavigation(); 
        displayReaderImages(data);

    } catch (error) {
        console.error('Erro ao carregar imagens:', error);
        readerImagesContainer.innerHTML = '<p class="loading-text" style="color: #ff6b6b;">Erro ao carregar as páginas.</p>';
    } finally {
        setLoadingState(false);
    }
}

function displayReaderImages(data) {
    readerImagesContainer.innerHTML = '';

    const baseUrl = data.baseUrl;
    const chapterHash = data.chapter.hash;
    const pageFilenames = data.chapter.data;

    pageFilenames.forEach((filename, index) => {
        const imageUrl = `${baseUrl}/data/${chapterHash}/${filename}`;
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'manga-page-image';
        img.alt = `Página ${index + 1}`;
        img.loading = 'lazy';
        
        readerImagesContainer.appendChild(img);
    });
}

// --- (NOVAS FUNÇÕES DE NAVEGAÇÃO) ---

function setupReaderNavigation() {
    // 1. Limpa o select
    chapterSelect.innerHTML = '';
    
    // 2. Popula o select com os capítulos
    currentMangaChapterList.forEach((chapter, index) => {
        let chapNum = chapter.attributes.chapter;
        let chapTitle = chapter.attributes.title;
        let displayText = `Cap. ${chapNum}`;
        if (chapTitle) {
            displayText += `: ${chapTitle}`;
        }
        
        const option = document.createElement('option');
        option.value = index; // O valor da option será o índice
        option.innerText = displayText;
        
        if (index === currentChapterIndex) {
            option.selected = true; // Marca o capítulo atual como selecionado
        }
        
        chapterSelect.appendChild(option);
    });
    
    // 3. Habilita/Desabilita os botões de Próximo/Anterior
    prevChapterBtn.disabled = (currentChapterIndex === 0);
    prevChapterBtnBottom.disabled = (currentChapterIndex === 0);
    
    nextChapterBtn.disabled = (currentChapterIndex === currentMangaChapterList.length - 1);
    nextChapterBtnBottom.disabled = (currentChapterIndex === currentMangaChapterList.length - 1);
}

function navigateToChapter(index) {
    if (index < 0 || index >= currentMangaChapterList.length) return;
    
    const chapter = currentMangaChapterList[index];
    
    let chapNum = chapter.attributes.chapter;
    let chapTitle = chapter.attributes.title;
    let displayText = `Capítulo ${chapNum}`;
    if (chapTitle) {
        displayText += `: ${chapTitle}`;
    }
    
    loadReader(chapter.id, displayText, index);
}

function navigateToNextChapter() {
    navigateToChapter(currentChapterIndex + 1);
}

function navigateToPreviousChapter() {
    navigateToChapter(currentChapterIndex - 1);
}


// --- Funções Utilitárias ---

function setLoadingState(loading, section = 'content') {
    if (loading) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

function showError(message) {
    contentContainer.innerHTML = `<p class="loading-text" style="color: #ff6b6b;">${message}</p>`;
}