// const API_BASE_URL = 'http://127.0.0.1:8000/api';
let pastContestsOffset = 0;
const pastContestsLimit = 7;

// DOM elementlarini tekshirish funksiyasi
function checkRequiredElements() {
    const elements = {
        contest: document.getElementById("contest"),
        pastContests: document.getElementById("utgan-tanlovlar"),
        stats: document.getElementById("statistika-user-sidebar")
    };
    
    // Faqat mavjud elementlar uchun funksiyalarni chaqiramiz
    if (elements.contest) fetchContestData();
    else console.warn("contest ID-li element topilmadi - kelgusi tanlovlar ko'rsatilmaydi");
    
    if (elements.pastContests) fetchPastContests();
    else console.warn("utgan-tanlovlar ID-li element topilmadi");
    
    if (elements.stats) {
        const userId = getUserIdFromToken();
        if (userId) fetchStatistika(userId);
    } else console.warn("statistika-user-sidebar ID-li element topilmadi");
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM yuklandi - skript ishga tushdi");
    
    // Tokenni tekshirish
    const token = localStorage.getItem('access_token');
    if (!token) {
        showAlert('error', "Iltimos, tizimga kiring", () => {
            window.location.href = '/u/login/';
        });
        return;
    }

    checkRequiredElements();
});

// JWT tokenidan foydalanuvchi ID sini olish
function getUserIdFromToken() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.user_id || null;
    } catch (e) {
        console.error("Token parsing error:", e);
        return null;
    }
}

// Kelgusi tanlovlarni yuklash (optimallashtirilgan versiya)
async function fetchContestData() {
    const contestData = document.getElementById("contest");
    if (!contestData) return;
    
    try {
        // Yuklash animatsiyasi
        contestData.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                <p class="text-gray-600">Tanlovlar yuklanmoqda...</p>
            </div>
        `;
        
        const response = await axios.get(`${API_BASE_URL}/contest/upcoming/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        
        const contests = response.data;
        contestData.innerHTML = '';
        
        if (contests.length === 0) {
            contestData.innerHTML = `
                <div class="text-center py-6 bg-indigo-50 rounded-lg">
                    <i class="far fa-calendar-check text-indigo-500 text-3xl mb-2"></i>
                    <p class="text-gray-700">Hozircha rejalashtirilgan tanlovlar mavjud emas</p>
                </div>
            `;
            return;
        }
        
        contests.forEach(contest => {
            const contestCard = document.createElement('div');
            contestCard.className = 'contest-card bg-white rounded-xl shadow-sm overflow-hidden mb-4 transition-all duration-300 hover:shadow-md';
            contestCard.innerHTML = `
                <div class="p-5">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div class="mb-3 md:mb-0">
                            <h3 class="font-bold text-lg text-gray-800 mb-1 flex items-center">
                                <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                                ${contest.title}
                            </h3>
                            <div class="flex items-center text-sm text-gray-500">
                                <i class="far fa-clock mr-2"></i>
                                <span>${formatDate(contest.start_time)} | ${contest.start_time.slice(11, 16)} (Toshkent vaqti)</span>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <i class="fas fa-stopwatch mr-1"></i> ${contest.duration} daqiqa
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <i class="fas fa-tasks mr-1"></i> ${contest.problem_count} masala
                            </span>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div class="flex items-center mb-3 md:mb-0">
                            <div class="relative w-16 h-16 mr-4">
                                <svg class="w-full h-full" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" stroke-width="2"></circle>
                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#6366f1" stroke-width="2" 
                                        stroke-dasharray="100" stroke-dashoffset="${100 - contest.registration_percentage}"
                                        class="progress-ring">
                                    </circle>
                                    <text x="18" y="20.5" text-anchor="middle" font-size="10" fill="#6366f1" font-weight="bold">
                                        ${contest.registration_percentage}%
                                    </text>
                                </svg>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Ro'yxatdan o'tganlar</p>
                                <p class="text-sm font-medium text-gray-700">
                                    <i class="fas fa-users mr-1"></i> ${contest.registered_participants} ishtirokchi
                                </p>
                            </div>
                        </div>
                        
                        <button class="contest-register-btn flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm shadow-sm 
                            ${contest.is_registered ? 
                                'bg-green-100 text-green-800 hover:bg-green-200' : 
                                'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'}"
                            data-contest-id="${contest.id}">
                            <i class="fas ${contest.is_registered ? 'fa-check-circle' : 'fa-user-plus'} mr-2"></i>
                            ${contest.is_registered ? "Ro'yxatdan o'tilgan" : "Ro'yxatdan o'tish"}
                        </button>
                    </div>
                </div>
            `;
            contestData.appendChild(contestCard);
        });
        
        // Progress barlarni animatsiya qilish
        animateProgressRings();
        
        // Ro'yxatdan o'tish tugmalari uchun event listener
        document.querySelectorAll('.contest-register-btn').forEach(btn => {
            btn.addEventListener('click', handleRegistration);
        });
        
    } catch (error) {
        console.error("Tanlovlarni yuklashda xatolik:", error);
        contestData.innerHTML = `
            <div class="text-center py-6 bg-red-50 rounded-lg">
                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
                <p class="text-red-600 font-medium">Tanlovlarni yuklashda xatolik yuz berdi</p>
                <p class="text-gray-600 text-sm mt-1">${error.message || 'Iltimos, qayta urunib ko\'ring'}</p>
                <button onclick="fetchContestData()" class="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    <i class="fas fa-sync-alt mr-1"></i> Qayta yuklash
                </button>
            </div>
        `;
    }
}

// O'tgan tanlovlarni yuklash
async function fetchPastContests(loadMore = false) {
    const pastContestsTable = document.getElementById("utgan-tanlovlar");
    if (!pastContestsTable) return;

    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (!loadMore) {
        pastContestsOffset = 0;
        pastContestsTable.innerHTML = '';
        if (loadMoreBtn) loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Yuklanmoqda...';
    }
    
    try {
        const response = await axios.get(`${API_BASE_URL}/contest/past/?offset=${pastContestsOffset}&limit=${pastContestsLimit}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        
        const contests = response.data;
        
        if (contests.length === 0) {
            if (loadMore) {
                showAlert('info', "Barcha tanlovlar yuklandi");
            } else {
                pastContestsTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-8 text-center">
                            <div class="bg-indigo-50 rounded-lg p-4 inline-block">
                                <i class="far fa-calendar-times text-indigo-500 text-3xl mb-2"></i>
                                <p class="text-gray-700">O'tgan tanlovlar topilmadi</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
            if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
            return;
        }
        
        contests.forEach(contest => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors duration-200';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            <i class="fas fa-laptop-code"></i>
                        </div>
                        <div class="ml-4">
                            <div class="font-medium text-gray-900">${contest.title}</div>
                            <div class="text-sm text-gray-500">${contest.problem_count} ta masala</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatDate(contest.start_time)}</div>
                    <div class="text-xs text-gray-500">${contest.start_time.slice(11, 16)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${contest.user_rank <= 10 ? 'bg-green-100 text-green-800' : 
                          contest.user_rank <= 50 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                        #${contest.user_rank || '-'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center">
                        <i class="fas fa-star text-yellow-400 mr-1"></i>
                        ${contest.user_score || '0'}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="/contests/${contest.id}/results/" class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-chart-bar mr-1"></i> Natijalar
                    </a>
                    <a href="/contests/${contest.id}/" class="text-purple-600 hover:text-purple-900">
                        <i class="fas fa-info-circle mr-1"></i> Batafsil
                    </a>
                </td>
            `;
            pastContestsTable.appendChild(row);
        });
        
        pastContestsOffset += contests.length;
        
        if (loadMoreBtn) {
            if (contests.length < pastContestsLimit) {
                loadMoreBtn.classList.add('hidden');
            } else {
                loadMoreBtn.classList.remove('hidden');
                loadMoreBtn.innerHTML = '<i class="fas fa-redo mr-2"></i> Ko\'proq yuklash';
            }
        }
    } catch (error) {
        console.error("O'tgan tanlovlarni yuklashda xatolik:", error);
        pastContestsTable.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center">
                    <div class="bg-red-50 rounded-lg p-4 inline-block">
                        <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-2"></i>
                        <p class="text-red-600 font-medium">Xatolik yuz berdi</p>
                        <p class="text-gray-600 text-sm mt-1">${error.message || "Ma\'lumotlarni yuklab bo\'lmadi"}</p>
                        <button onclick="fetchPastContests()" class="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            <i class="fas fa-sync-alt mr-1"></i> Qayta urunish
                        </button>
                    </div>
                </td>
            </tr>
        `;
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
    }
}

// Foydalanuvchi statistikasini yuklash
async function fetchStatistika(userId) {
    const statsContainer = document.getElementById("statistika-user-sidebar");
    if (!statsContainer) return;
    
    try {
        statsContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                <p class="text-gray-600">Statistika yuklanmoqda...</p>
            </div>
        `;
        
        const response = await axios.get(`${API_BASE_URL}/contest/stats/${userId}/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        
        const stats = response.data;
        
        statsContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center">
                        <i class="fas fa-chart-pie text-indigo-600 mr-2"></i>
                        Mening Statistikam
                    </h3>
                </div>
                <div class="p-6 space-y-5">
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700 flex items-center">
                                <i class="fas fa-calendar-check text-indigo-500 mr-2"></i>
                                Ishtiroklar
                            </span>
                            <span class="text-sm font-semibold text-gray-900">${stats.total_contests || 0}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-indigo-600 h-2.5 rounded-full" 
                                style="width: ${Math.min(100, (stats.total_contests || 0) / 50 * 100)}%">
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700 flex items-center">
                                <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                                Eng yaxshi o'rin
                            </span>
                            <span class="text-sm font-semibold text-gray-900">${stats.best_rank ? '#' + stats.best_rank : '-'}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-yellow-500 h-2.5 rounded-full" 
                                style="width: ${stats.best_rank ? (1 / stats.best_rank) * 100 : 0}%">
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700 flex items-center">
                                <i class="fas fa-chess-king text-purple-500 mr-2"></i>
                                O'rtacha o'rin
                            </span>
                            <span class="text-sm font-semibold text-gray-900">${stats.average_rank ? '#' + stats.average_rank.toFixed(1) : '-'}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-purple-600 h-2.5 rounded-full" 
                                style="width: ${stats.average_rank ? (1 / stats.average_rank) * 100 : 0}%">
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700 flex items-center">
                                <i class="fas fa-star text-green-500 mr-2"></i>
                                Yig'ilgan ball
                            </span>
                            <span class="text-sm font-semibold text-gray-900">${stats.total_points || 0}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-green-500 h-2.5 rounded-full" 
                                style="width: ${Math.min(100, (stats.total_points || 0) / 50000 * 100)}%">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Statistika yuklashda xatolik:", error);
        statsContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center">
                        <i class="fas fa-chart-pie text-indigo-600 mr-2"></i>
                        Statistika
                    </h3>
                </div>
                <div class="p-6 text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-600 font-medium">Statistika yuklanmadi</p>
                    <p class="text-gray-600 text-sm mt-1">${error.message || 'Server bilan bog\'liq muammo'}</p>
                    <button onclick="fetchStatistika(getUserIdFromToken())" class="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        <i class="fas fa-sync-alt mr-1"></i> Qayta urunish
                    </button>
                </div>
            </div>
        `;
    }
}

// Ro'yxatdan o'tishni boshqarish
async function handleRegistration(event) {
    const button = event.currentTarget;
    const contestId = button.dataset.contestId;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Jarayonda...';
    button.disabled = true;
    
    try {
        const response = await axios.post(
            `${API_BASE_URL}/contest/register/`,
            { contest_id: contestId },
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.success) {
            button.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Ro\'yxatdan o\'tilgan';
            button.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'hover:from-indigo-600', 'hover:to-purple-700', 'text-white');
            button.classList.add('bg-green-100', 'text-green-800', 'hover:bg-green-200');
            showAlert('success', "Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        }
    } catch (error) {
        console.error("Ro'yxatdan o'tishda xatolik:", error);
        button.innerHTML = `<i class="fas fa-user-plus mr-2"></i> Ro'yxatdan o'tish`;
        button.disabled = false;
        showAlert('error', error.response?.data?.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    }
}

// Progress barlarni animatsiya qilish
function animateProgressRings() {
    const rings = document.querySelectorAll('.progress-ring');
    rings.forEach(ring => {
        const radius = ring.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        ring.style.strokeDasharray = `${circumference} ${circumference}`;
        ring.style.strokeDashoffset = circumference;
        
        const offset = circumference - (parseInt(ring.getAttribute('stroke-dashoffset')) / 100) * circumference;
        setTimeout(() => {
            ring.style.strokeDashoffset = offset;
        }, 100);
    });
}

// Sana formati
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uz-UZ', options);
}

// Xabarnoma ko'rsatish
function showAlert(type, message, callback = null) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-6 right-6 z-50 flex items-center p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
        type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' : 
        type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 
        'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
    }`;
    
    alertDiv.innerHTML = `
        <div class="mr-3 text-xl">
            ${type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : 
             type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
             '<i class="fas fa-info-circle"></i>'}
        </div>
        <div>
            <p class="font-medium">${message}</p>
        </div>
        <button class="ml-4 text-gray-500 hover:text-gray-700" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.classList.add('opacity-0');
        setTimeout(() => {
            alertDiv.remove();
            if (callback) callback();
        }, 300);
    }, 5000);
}

// "Ko'proq yuklash" tugmasi uchun event listener
document.querySelector('.load-more-btn')?.addEventListener('click', () => {
    fetchPastContests(true);
});

// DOM yuklanganda progress barlarni animatsiya qilish
document.addEventListener('DOMContentLoaded', animateProgressRings);