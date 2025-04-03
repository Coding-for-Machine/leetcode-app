let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timeLeft = 600; // Default 10 minutes
let timerInterval = null;
let quizStartTime = null;

// DOM elements
const quizContainer = document.getElementById('quizContainer');
const quizTitle = document.getElementById('quizTitle');
const quizTitleNav = document.getElementById('quizTitleNav');
const quizDescription = document.getElementById('quizDescription');
const questionsCount = document.getElementById('questionsCount');
const timeLimit = document.getElementById('timeLimit');
const passingScore = document.getElementById('passingScore');
const progressBar = document.getElementById('progressBar');
const questionNav = document.getElementById('questionNav');
const submitBtn = document.getElementById('submitBtn');
const saveBtn = document.getElementById('saveBtn');

// Results modal elements
const resultsModal = document.getElementById('resultsModal');
const resultPercentage = document.getElementById('resultPercentage');
const resultTitle = document.getElementById('resultTitle');
const resultSummary = document.getElementById('resultSummary');
const correctAnswersEl = document.getElementById('correctAnswers');
const wrongAnswersEl = document.getElementById('wrongAnswers');
const scorePercentageEl = document.getElementById('scorePercentage');
const passedStatus = document.getElementById('passedStatus');
const resultCircle = document.getElementById('resultCircle');

// Load quiz data from API
async function loadQuiz(quizId) {
    try {
        quizStartTime = new Date();
        const response = await axios.get(`/api/quizzes/${quizId}/`);
        currentQuiz = response.data;
        
        // Update quiz info
        quizTitle.textContent = currentQuiz.title;
        quizTitleNav.textContent = `Test: ${currentQuiz.title}`;
        quizDescription.textContent = currentQuiz.description;
        questionsCount.textContent = `${currentQuiz.questions.length} ta savol`;
        timeLimit.textContent = `${Math.floor(currentQuiz.time_limit / 60)} daqiqa`;
        passingScore.textContent = `${currentQuiz.passing_score}% (o'tish balli)`;
        timeLeft = currentQuiz.time_limit;
        
        // Start timer
        startTimer();
        
        // Render first question
        renderQuestion(currentQuestionIndex);
        
        // Render navigation
        renderNavigation();
        
    } catch (error) {
        console.error('Test yuklanmadi:', error);
        alert('Test yuklanmadi, iltimos keyinroq urinib ko\'ring');
    }
}

// Start the timer
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Render question
function renderQuestion(index) {
    if (!currentQuiz || !currentQuiz.questions || index >= currentQuiz.questions.length) return;
    
    const question = currentQuiz.questions[index];
    quizContainer.innerHTML = '';
    
    const questionElement = document.createElement('div');
    questionElement.className = `question-card bg-white rounded-lg shadow-md overflow-hidden mb-6 ${index === currentQuestionIndex ? 'border-2 border-indigo-500' : ''}`;
    questionElement.setAttribute('data-question-id', question.id);
    questionElement.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-start mb-4">
                <h2 class="text-lg font-semibold text-gray-800">${index + 1}. ${question.description}</h2>
                <span class="text-sm text-gray-500">${index + 1}/${currentQuiz.questions.length}</span>
            </div>
            
            <div class="space-y-3" id="answersContainer">
                ${question.answers.map((answer, i) => `
                    <div class="answer-option border border-gray-200 rounded-lg p-4 cursor-pointer 
                        ${userAnswers[question.id] === answer.id ? 'selected' : ''}"
                        data-question-id="${question.id}"
                        data-answer-id="${answer.id}">
                        <div class="flex items-center">
                            <div class="w-5 h-5 rounded-full border border-gray-300 mr-3 flex-shrink-0"></div>
                            <span>${answer.description}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="bg-gray-50 px-6 py-3 flex justify-between items-center">
            <button class="prev-btn text-indigo-600 hover:text-indigo-800 font-medium" ${index === 0 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left mr-1"></i> Oldingi
            </button>
            <button class="next-btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium">
                ${index === currentQuiz.questions.length - 1 ? 'Testni yakunlash' : 'Keyingi'} 
                <i class="fas fa-chevron-right ml-1"></i>
            </button>
        </div>
    `;
    
    quizContainer.appendChild(questionElement);
    
    // Add event listeners
    document.querySelectorAll('.answer-option').forEach(option => {
        option.addEventListener('click', function() {
            const questionId = parseInt(this.getAttribute('data-question-id'));
            const answerId = parseInt(this.getAttribute('data-answer-id'));
            
            // Remove selected class from all options in this question
            document.querySelectorAll(`.answer-option[data-question-id="${questionId}"]`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Save answer
            userAnswers[questionId] = answerId;
            
            // Update navigation
            updateNavigation();
        });
    });
    
    // Navigation buttons
    document.querySelector('.prev-btn')?.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion(currentQuestionIndex);
        }
    });
    
    document.querySelector('.next-btn')?.addEventListener('click', () => {
        if (currentQuestionIndex < currentQuiz.questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion(currentQuestionIndex);
        } else {
            submitQuiz();
        }
    });
}

// Render navigation buttons
function renderNavigation() {
    questionNav.innerHTML = '';
    
    currentQuiz.questions.forEach((question, index) => {
        const navBtn = document.createElement('div');
        navBtn.className = `p-2 text-center cursor-pointer rounded-md ${
            index === currentQuestionIndex ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-500' :
            userAnswers[question.id] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`;
        navBtn.textContent = index + 1;
        navBtn.addEventListener('click', () => {
            currentQuestionIndex = index;
            renderQuestion(currentQuestionIndex);
        });
        
        questionNav.appendChild(navBtn);
    });
}

// Update navigation buttons
function updateNavigation() {
    currentQuiz.questions.forEach((question, index) => {
        const navBtn = questionNav.children[index];
        if (navBtn) {
            navBtn.className = `p-2 text-center cursor-pointer rounded-md ${
                index === currentQuestionIndex ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-500' :
                userAnswers[question.id] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`;
        }
    });
    
    // Update progress bar
    const answeredCount = Object.keys(userAnswers).length;
    const progress = (answeredCount / currentQuiz.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// Submit quiz
async function submitQuiz() {
    clearInterval(timerInterval);
    
    try {
        const response = await axios.post(`/api/quizzes/${currentQuiz.id}/attempts/`, {
            answers: userAnswers,
            start_time: quizStartTime.toISOString()
        }, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        showResults(response.data);
    } catch (error) {
        console.error('Test yuborilmadi:', error);
        alert('Test yuborishda xatolik yuz berdi, iltimos keyinroq urinib ko\'ring');
    }
}

// Show results
function showResults(results) {
    // Calculate correct and wrong answers
    const questionDetails = Object.values(results.details);
    const correctCount = questionDetails.filter(detail => detail.correct).length;
    const wrongCount = questionDetails.length - correctCount;
    
    // Update UI
    correctAnswersEl.textContent = correctCount;
    wrongAnswersEl.textContent = wrongCount;
    scorePercentageEl.textContent = `${results.score}%`;
    resultPercentage.textContent = `${results.score}%`;
    
    // Set pass/fail status
    passedStatus.textContent = results.passed ? "Muvaffaqiyatli" : "Muvaffaqiyatsiz";
    passedStatus.className = results.passed ? "font-medium text-green-600" : "font-medium text-red-600";
    
    // Set result title and summary
    resultTitle.textContent = results.passed ? "Tabriklaymiz!" : "Afsuski";
    resultSummary.textContent = `Siz ${questionDetails.length} ta savoldan ${correctCount} tasiga to'g'ri javob berdingiz.`;
    
    // Update circle color
    resultCircle.className = `w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
        results.passed ? 'bg-green-100' : 'bg-red-100'
    }`;
    
    // Show modal
    resultsModal.classList.remove('hidden');
    
    // Highlight answers
    highlightAnswers(results.details);
}

// Highlight correct/incorrect answers
function highlightAnswers(details) {
    Object.entries(details).forEach(([questionId, detail]) => {
        const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
        if (!questionElement) return;
        
        // Highlight selected answer
        if (detail.answered) {
            const answerElement = questionElement.querySelector(`[data-answer-id="${detail.answered}"]`);
            if (answerElement) {
                answerElement.classList.add(detail.correct ? 'correct' : 'incorrect');
            }
        }
        
        // Highlight correct answers if enabled
        if (currentQuiz.show_correct_answers) {
            detail.correct_answers.forEach(correctId => {
                const correctElement = questionElement.querySelector(`[data-answer-id="${correctId}"]`);
                if (correctElement && !correctElement.classList.contains('incorrect')) {
                    correctElement.classList.add('correct');
                }
            });
        }
    });
}

// Get auth token from storage
function getAuthToken() {
    // Implement based on your auth system
    return localStorage.getItem('authToken') || '';
}

// Reset quiz
function resetQuiz() {
    currentQuestionIndex = 0;
    userAnswers = {};
    timeLeft = currentQuiz.time_limit;
    quizStartTime = new Date();
    startTimer();
    renderQuestion(currentQuestionIndex);
    renderNavigation();
}

// Event listeners
document.getElementById('closeModal').addEventListener('click', () => {
    resultsModal.classList.add('hidden');
});

document.getElementById('retryBtn').addEventListener('click', () => {
    resultsModal.classList.add('hidden');
    resetQuiz();
});

document.getElementById('explanationBtn').addEventListener('click', () => {
    alert("Tushuntirish sahifasi ishlab chiqilmoqda...");
});

document.getElementById('submitBtn').addEventListener('click', submitQuiz);

document.getElementById('saveBtn').addEventListener('click', () => {
    alert("Javoblar saqlandi!");
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get quiz ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz_id') || 1;
    
    // Load quiz
    loadQuiz(quizId);
});