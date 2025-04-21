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
    const token = getCookie('access_token');
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
    const token = getCookie('access_token');
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
        
        const response = await apiRequest("contest/upcoming/", "GET", null, true);
        
        if (!response.success) {
            throw new Error(response.error.message);
        }
        
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
                <!-- Kontent o'zgarishsiz qoldi -->
                <!-- Oldingi koddagi HTML qismi -->
            `;
            contestData.appendChild(contestCard);
        });
        
        animateProgressRings();
        
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
        const response = await apiRequest(
            `contest/past/?offset=${pastContestsOffset}&limit=${pastContestsLimit}`, 
            "GET", 
            null, 
            true
        );
        
        if (!response.success) {
            throw new Error(response.error.message);
        }
        
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
        
        // Qolgan kod o'zgarishsiz
    } catch (error) {
        console.error("O'tgan tanlovlarni yuklashda xatolik:", error);
        // Xato ishlov berish qismi
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
        
        const response = await apiRequest(`contest/stats/${userId}/`, "GET", null, true);
        
        if (!response.success) {
            throw new Error(response.error.message);
        }
        
        const stats = response.data;
        
        // Statistikani ko'rsatish kodi o'zgarishsiz
    } catch (error) {
        console.error("Statistika yuklashda xatolik:", error);
        // Xato ishlov berish qismi
    }
}

// Ro'yxatdan o'tishni boshqarish
async function handleRegistration(event) {
    const button = event.currentTarget;
    const contestId = button.dataset.contestId;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Jarayonda...';
    button.disabled = true;
    
    try {
        const response = await apiRequest(
            "contest/register/",
            "POST",
            { contest_id: contestId },
            true
        );
        
        if (!response.success) {
            throw new Error(response.error.message);
        }
        
        button.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Ro\'yxatdan o\'tilgan';
        button.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'hover:from-indigo-600', 'hover:to-purple-700', 'text-white');
        button.classList.add('bg-green-100', 'text-green-800', 'hover:bg-green-200');
        showAlert('success', "Muvaffaqiyatli ro'yxatdan o'tdingiz!");
    } catch (error) {
        console.error("Ro'yxatdan o'tishda xatolik:", error);
        button.innerHTML = `<i class="fas fa-user-plus mr-2"></i> Ro'yxatdan o'tish`;
        button.disabled = false;
        showAlert('error', error.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    }
}

// Qolgan yordamchi funksiyalar o'zgarishsiz qoladi
// animateProgressRings, formatDate, showAlert

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


// "Ko'proq yuklash" tugmasi uchun event listener
document.querySelector('.load-more-btn')?.addEventListener('click', () => {
    fetchPastContests(true);
});

// DOM yuklanganda progress barlarni animatsiya qilish
document.addEventListener('DOMContentLoaded', animateProgressRings);