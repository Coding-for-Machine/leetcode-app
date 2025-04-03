// Asosiy o'zgaruvchilar
let tugriQUIZ = null;
let quizzes = [];
const API_BASE_URL = 'http://127.0.0.1:8000/api/';  // API manzilini to'g'rilang

// DOM elementlari
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const quizList = document.getElementById('quizList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const quizModal = document.getElementById('quizModal');
const modalQuizTitle = document.getElementById('modalQuizTitle');
const quizDetailContent = document.getElementById('quizDetailContent');
const closeModalBtn = document.getElementById('closeModalBtn');
const backButton = document.getElementById('backButton');
const startQuizBtn = document.getElementById('startQuizBtn');

// Dastur ishga tushganda
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM yuklandi, testlarni yuklash boshlandi...");
    loadQuizzes();
    
    // Event listenerlar
    searchInput.addEventListener('input', debounce(searchQuizzes, 500));
    closeModalBtn.addEventListener('click', closeModal);
    backButton.addEventListener('click', closeModal);
    
    // Modal tashqarisiga bosganda yopish
    quizModal.addEventListener('click', function(e) {
        if (e.target === quizModal) {
            closeModal();
        }
    });
    
    // Escape tugmasi bilan modalni yopish
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !quizModal.classList.contains('hidden')) {
            closeModal();
        }
    });
});

// Testlarni yuklash (Axios bilan)
async function loadQuizzes() {
    console.log("Testlarni yuklash funksiyasi ishga tushdi");
    try {
        showLoading();
        hideError();
        
        console.log("API so'rovi yuborilmoqda...");
        const response = await axios.get(`${API_BASE_URL}quizzes/`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log("API javobi:", response);
        
        if (!response.data) {
            throw new Error('Serverdan hech qanday ma\'lumot kelmadi');
        }
        
        quizzes = response.data;
        console.log("Olingan testlar:", quizzes);
        renderQuizList(quizzes);
    } catch (error) {
        console.error('Xatolik yuz berdi:', error);
        showError('Testlarni yuklashda xatolik yuz berdi. Iltimos, qayta urunib ko\'ring.');
    } finally {
        hideLoading();
    }
}

// Qidiruv funksiyasi
async function searchQuizzes() {
    try {
        showLoading();
        const query = searchInput.value.trim();
        const url = query 
            ? `${API_BASE_URL}quizzes/?search=${encodeURIComponent(query)}` 
            : `${API_BASE_URL}quizzes/`;
        
        const response = await axios.get(url);
        quizzes = response.data;
        renderQuizList(quizzes);
    } catch (error) {
        console.error('Qidiruv xatosi:', error);
        showError('Qidiruvda xatolik yuz berdi');
    } finally {
        hideLoading();
    }
}

// Test tafsilotlarini yuklash
async function loadQuizDetails(quizId) {
    try {
        showLoading();
        const response = await axios.get(`${API_BASE_URL}quizzes/${quizId}/`);
        return response.data;
    } catch (error) {
        console.error('Test yuklash xatosi:', error);
        showError('Test ma\'lumotlarini yuklashda xatolik');
        return null;
    } finally {
        hideLoading();
    }
}

// Testlar ro'yxatini ko'rsatish
function renderQuizList(quizzes) {
    console.log("Testlar ro'yxatini ko'rsatish funksiyasi");
    quizList.innerHTML = '';
    
    if (!quizzes || quizzes.length === 0) {
        console.log("Testlar topilmadi, bo'sh holat ko'rsatilmoqda");
        emptyState.classList.remove('hidden');
        quizList.classList.add('hidden');
        return;
    }
    
    console.log(`${quizzes.length} ta test ko'rsatilmoqda`);
    emptyState.classList.add('hidden');
    quizList.classList.remove('hidden');
    
    const template = document.getElementById('quizItemTemplate').innerHTML;
    
    quizzes.forEach(quiz => {
        const html = template
            .replace(/{{title}}/g, quiz.title || "Noma'lum test")
            .replace(/{{description}}/g, quiz.description || "Tavsif mavjud emas")
            .replace(/{{time_limit}}/g, quiz.time_limit || 0)
            .replace(/{{passing_score}}/g, quiz.passing_score || 60)
            .replace(/{{attempts_allowed}}/g, quiz.attempts_allowed || 1)
            .replace(/{{category}}/g, quiz.category || "Umumiy")
            .replace(/{{id}}/g, quiz.id);
        
        const div = document.createElement('div');
        div.innerHTML = html;
        quizList.appendChild(div.firstElementChild);
    });
    
    // Batafsil tugmalariga event listener qo'shish
    document.querySelectorAll('.quiz-detail-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const quizId = this.getAttribute('data-quiz-id');
            console.log(`Test ID ${quizId} uchun tafsilotlar yuklanmoqda`);
            const quiz = await loadQuizDetails(quizId);
            if (quiz) {
                showQuizDetails(quiz);
            }
        });
    });
}

// Test tafsilotlarini ko'rsatish
function showQuizDetails(quiz) {
    console.log("Test tafsilotlari ko'rsatilmoqda:", quiz);
    tugriQUIZ = quiz;
    
    modalQuizTitle.textContent = quiz.title || "Noma'lum test";
    
    const showAnswers = quiz.show_correct_answers ? "Ko'rsatiladi" : "Ko'rsatilmaydi";
    const template = document.getElementById('quizDetailTemplate').innerHTML;
    const html = template
        .replace(/{{description}}/g, quiz.description || "Tavsif mavjud emas")
        .replace(/{{time_limit}}/g, quiz.time_limit || 0)
        .replace(/{{passing_score}}/g, quiz.passing_score || 60)
        .replace(/{{attempts_allowed}}/g, quiz.attempts_allowed || 1)
        .replace(/{{show_correct_answers}}/g, showAnswers);
    
    quizDetailContent.innerHTML = html;
    
    startQuizBtn.onclick = function() {
        if (quiz && quiz.id) {
            window.location.href = `quiz/${quiz.id}/`;
        }
    };
    
    quizModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Modalni yopish
function closeModal() {
    quizModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Yuklash holatini ko'rsatish
function showLoading() {
    console.log("Yuklash holati ko'rsatilmoqda");
    loadingState.classList.remove('hidden');
    quizList.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
}

// Yuklash holatini yopish
function hideLoading() {
    console.log("Yuklash holati yopilmoqda");
    loadingState.classList.add('hidden');
}

// Xatolikni ko'rsatish
function showError(message) {
    console.log("Xato ko'rsatilmoqda:", message);
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

// Xatolikni yashirish
function hideError() {
    errorState.classList.add('hidden');
}

// Debounce funksiyasi
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}