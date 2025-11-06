// ATENÇÃO: Configurado para rodar com o Firebase
const SERVER_URL = '/api';

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

// Elementos de Navegação do Leitor
const prevChapterBtn = document.getElementById('prevChapterBtn');
const nextChapterBtn = document.getElementById('nextChapterBtn');
const chapterSelect = document.getElementById('chapterSelect');
const prevChapterBtnBottom = document.getElementById('prevChapterBtnBottom');
const nextChapterBtnBottom = document.getElementById('nextChapterBtnBottom');
const downloadPdfBtn = document.getElementById('downloadPdfBtn'); // Botão PDF

// Variáveis de estado para navegação
let currentMangaChapterList = [];
let currentChapterIndex = 0;

// Mapeamento de gêneros
const GENRE_MAP = {
  "shounen": "423e2eae-a7a2-4a8b-ac03-a8351462d71d",
  "action": "391b0423-d847-456f-aff0-8b0cfc03066b",
  "fantasy": "cdc58593-87dd-415e-bbc0-2ec27bf404cc",
  "romance": "423e2eae-a7a2-4a8b-ac03-a8351462d71d", // ERRADO no teu código
  "comedy": "e5301a23-ebd9-49dd-a0cb-2add944c7fe9", // ID certo
  "horror": "cdad7e68-1419-41dd-bdce-27753074a640",
  "isekai": '51d83739-ccd2-4f5a-8523-2d5b164d6aba' // ID certo
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

// Listeners para navegação do leitor
prevChapterBtn.addEventListener('click', navigateToPreviousChapter);
nextChapterBtn.addEventListener('click', navigateToNextChapter);
prevChapterBtnBottom.addEventListener('click', navigateToPreviousChapter);
nextChapterBtnBottom.addEventListener('click', navigateToNextChapter);

chapterSelect.addEventListener('change', (e) => {
    const newIndex = parseInt(e.target.value, 10);
    navigateToChapter(newIndex);
});

downloadPdfBtn.addEventListener('click', downloadChapterAsPdf);


// --- Funções de Navegação ---

function showSection(section) {
    contentTitleContainer.classList.add('hidden');
    contentContainer.classList.add('hidden');
    chapterContainer.classList.add('hidden');
    readerContainer.classList.add('hidden');
    
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
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            showSection('content'); 

            const category = button.dataset.category;
            loadCategory(category);
        });
    });
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        showSection('content');
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
                setLoadingState(false); // <-- Adicionado para parar o loading
                return;
            }
            
            const response = await fetch(`${SERVER_URL}/genre/${genreId}`);
            if (!response.ok) throw new Error('Falha na resposta do servidor');
            data = await response.json();
            
            const categoryNames = {
                'shounen': '⚡ Shounen',
                'action': '💥 Ação',
                'fantasy': '🧙 Fantasia',
                'horror': '👻 Horror',
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
            loadChapters(manga.id, title); // Simplificado: removemos a lógica de 'source'
        });
        
        contentContainer.appendChild(card);
    });
}

// REMOVIDO a função 'displayScrapedMangaList'

async function loadChapters(mangaId, mangaTitle) { // Simplificado
    setLoadingState(true, 'chapters');
    showSection('chapters');
    chapterMangaTitle.innerText = mangaTitle;
    chapterListElement.innerHTML = '<p class="loading-text">Carregando capítulos...</p>';
    currentMangaChapterList = []; 
    
    const apiUrl = `${SERVER_URL}/chapters/${mangaId}`; // Simplificado

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Falha ao buscar capítulos');
        const data = await response.json();
        
        displayChapters(data.data); // Simplificado
        
    } catch (error) {
        console.error('Erro ao carregar capítulos:', error);
        chapterListElement.innerHTML = '<p class="loading-text" style="color: #ff6b6b;">Erro ao carregar capítulos.</p>';
    } finally {
        setLoadingState(false);
    }
}

function displayChapters(chapterList) { // Simplificado
    chapterListElement.innerHTML = '';

    if (!chapterList || chapterList.length === 0) {
        chapterListElement.innerHTML = '<p class="loading-text">Nenhum capítulo PT-BR encontrado.</p>';
        return;
    }
    
    const sortedChapters = chapterList.sort((a, b) => parseFloat(a.attributes.chapter) - parseFloat(b.attributes.chapter));
    
    currentMangaChapterList = sortedChapters; 

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
            loadReader(chapter.id, displayText, index); // Simplificado
        });

        chapterListElement.appendChild(chapterDiv);
    });
}

async function loadReader(chapterId, chapterTitle, index) { // Simplificado
    setLoadingState(true, 'reader');
    showSection('reader');
    readerChapterTitle.innerText = chapterTitle;
    readerImagesContainer.innerHTML = '<p class="loading-text">Carregando páginas...</p>';
    
    currentChapterIndex = index;
    
    const apiUrl = `${SERVER_URL}/reader/${chapterId}`; // Simplificado

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Falha ao buscar o servidor do capítulo');
        const data = await response.json();
        
        setupReaderNavigation(); // Simplificado
        displayReaderImages(data); // Simplificado

    } catch (error) {
        console.error('Erro ao carregar imagens:', error);
        readerImagesContainer.innerHTML = '<p class="loading-text" style="color: #ff6b6b;">Erro ao carregar as páginas.</p>';
    } finally {
        setLoadingState(false);
    }
}

function displayReaderImages(data) { // Simplificado
    readerImagesContainer.innerHTML = '';
    
    // Padrão (MangaDex)
    const baseUrl = data.baseUrl;
    const chapterHash = data.chapter.hash;
    const pageData = data.chapter.data;
    const pageFilenames = pageData.map(filename => `${baseUrl}/data/${chapterHash}/${filename}`);

    pageFilenames.forEach((imageUrl, index) => {
        const img = document.createElement('img');
        
        img.src = imageUrl; // Simplificado
        
        img.className = 'manga-page-image';
        img.alt = `Página ${index + 1}`;
        img.loading = 'lazy';
        
        readerImagesContainer.appendChild(img);
    });
}

// --- Funções de Navegação do Leitor ---

function setupReaderNavigation() { // Simplificado
    chapterSelect.innerHTML = '';
    
    currentMangaChapterList.forEach((chapter, index) => {
        let chapNum = chapter.attributes.chapter;
        let chapTitle = chapter.attributes.title;
        let displayText = `Cap. ${chapNum}`;
        if (chapTitle) {
            displayText += `: ${chapTitle}`;
        }
        
        const option = document.createElement('option');
        option.value = index;
        option.innerText = displayText;
        
        if (index === currentChapterIndex) {
            option.selected = true;
        }
        
        chapterSelect.appendChild(option);
    });
    
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
    
    loadReader(chapter.id, displayText, index); // Simplificado
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

// --- Funções de Download PDF ---

// Função auxiliar para carregar a imagem via proxy
async function fetchImageAsDataURL(originalUrl) {
    const proxyUrl = `${SERVER_URL}/proxy?url=${encodeURIComponent(originalUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
        throw new Error(`Falha ao buscar imagem: ${response.statusText}`);
    }
    
    const imageBlob = await response.blob();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
    });
}

// Função para carregar as dimensões da imagem
function getImageDimensions(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

// *** FUNÇÃO MODIFICADA (CORREÇÃO DO PDF) ***
// Função principal que gera o PDF
async function downloadChapterAsPdf() {
    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pdfWidth - (margin * 2);
    
    const images = readerImagesContainer.querySelectorAll('.manga-page-image');
    const title = readerChapterTitle.innerText;

    downloadPdfBtn.disabled = true;
    let imagesFailed = 0;
    
    for (let i = 0; i < images.length; i++) {
        downloadPdfBtn.innerText = `Baixando... (${Math.round(((i+1)/images.length) * 100)}%)`;
        const imgElement = images[i];
        
        // ** O TRY/CATCH FOI MOVIDO PARA DENTRO DO LOOP **
        try {
            // O '.src' do elemento de imagem já contém a URL correta (direta ou proxy)
            const originalUrl = imgElement.src; 
            
            // 1. Busca a imagem (se for proxy, já está com proxy)
            const dataUrl = await fetchImageAsDataURL(originalUrl);
            
            // 2. Pega as dimensões
            const dims = await getImageDimensions(dataUrl);
            
            // 3. Calcula a altura
            const imgHeight = (dims.height * usableWidth) / dims.width;
            
            // Evita adicionar páginas com altura 0
            if (imgHeight > 0) {
                // 4. Adiciona a imagem
                doc.addImage(dataUrl, 'JPEG', margin, margin, usableWidth, imgHeight);

                // 5. Adiciona nova página
                if (i < images.length - 1) {
                    doc.addPage();
                }
            } else {
                console.warn(`Imagem ${i + 1} com altura 0. Pulando...`);
                imagesFailed++;
            }
            
        } catch (error) {
            // Se falhar (ex: página de créditos bloqueada), avisa no console e pula
            console.warn(`Falha ao baixar imagem ${i + 1}: ${error.message}. Pulando...`);
            imagesFailed++;
        }
    }

    // 6. Salva o PDF
    doc.save(`${title}.pdf`);

    // Reseta o botão
    downloadPdfBtn.disabled = false;
    downloadPdfBtn.innerText = 'Baixar PDF';

    if (imagesFailed > 0) {
        alert(`PDF salvo! ${imagesFailed} página(s) (como páginas de crédito) não puderam ser baixadas.`);
    }
}