let pastContestsOffset = 0;
const pastContestsLimit = 7;

// DOM yuklanganda ishga tushirish
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM yuklandi - skript ishga tushdi");

    const token = getCookie('access_token');
    if (!token) {
        showAlert('error', "Iltimos, tizimga kiring", () => {
            window.location.href = '/u/login/';
        });
        return;
    }

    checkRequiredElements();
    animateProgressRings();
});

// Majburiy elementlarni tekshirish
function checkRequiredElements() {
    const elements = {
        contest: document.getElementById("contest"),
        pastContests: document.getElementById("utgan-tanlovlar"),
        stats: document.getElementById("statistika-user-sidebar")
    };

    if (elements.contest) fetchContestData();
    else console.warn("contest ID-li element topilmadi");

    if (elements.pastContests) fetchPastContests();
    else console.warn("utgan-tanlovlar ID-li element topilmadi");

    if (elements.stats) {
        const userId = getUserIdFromToken();
        if (userId) fetchStatistika(userId);
    } else console.warn("statistika-user-sidebar ID-li element topilmadi");
}

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

// Cookie olish
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Tanlovlarni yuklash
async function fetchContestData() {
    const contestData = document.getElementById("contest");
    if (!contestData) return;

    try {
        contestData.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                <p class="text-gray-600">Tanlovlar yuklanmoqda...</p>
            </div>
        `;

        const token = getCookie('access_token');
        if (!token) throw new Error("Token topilmadi");

        const response = await fetch('/api/contest/upcoming/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Xatolik yuz berdi');

        const contests = data;
        contestData.innerHTML = '';

        if (!Array.isArray(contests) || contests.length === 0) {
            contestData.innerHTML = `
                <div class="text-center py-6 bg-indigo-50 rounded-lg">
                    <i class="far fa-calendar-check text-indigo-500 text-3xl mb-2"></i>
                    <p class="text-gray-700">Hozircha rejalashtirilgan tanlovlar mavjud emas</p>
                </div>
            `;
            return;
        }

        contests.forEach(contest => {
            const card = document.createElement('div');
            card.className = "bg-white rounded-lg shadow-md p-6 space-y-3 border-l-4 border-indigo-500";
            
            let registrationHtml = '';
            if (contest.is_user_register === true) {
                // Ro‘yxatdan o‘tgan bo‘lsa, yashil icon va badge qo‘shish
                registrationHtml += `
                    <span class="badge-success rounded-lg pt-[1px] px-3 pb-[2px] bg-green-400">
                        <i class="fas fa-check-circle text-green-500 mr-2"></i>Ro‘yxatdan o‘tgan
                    </span>
                `;
                
            } else {
                // Ro‘yxatdan o‘tilmagan bo‘lsa, chiqaradigan tugma
                registrationHtml += `
                    <button onclick="handleRegistration(event)" 
                    data-contest-id="${contest.id}" class="btn text-white rounded-lg pt-[1px] px-3 pb-[2px] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                        <i class="fas fa-user-plus mr-2"></i> Ro‘yxatdan o‘tish
                    </button>
                `;
            }
        
            card.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-800">${contest.title}</h3>
                <p class="text-sm text-gray-600"><i class="far fa-clock mr-1"></i> Boshlanish vaqti: ${formatDate(contest.start_time)}</p>
                <p class="text-sm text-gray-600"><i class="fas fa-list-ol mr-1"></i> Muammolar soni: ${contest.problem_count}</p>
                <p class="text-sm text-gray-600"><i class="fas fa-stopwatch mr-1"></i> Davomiyligi: ${contest.duration} daqiqa</p>
                ${registrationHtml}
                <a href="/contest/${contest.id}/" class="ml-4 text-indigo-600 text-sm hover:underline"><i class="fas fa-info-circle mr-1"></i> Batafsil</a>
            `;
            
            contestData.appendChild(card);
        });
        

    } catch (error) {
        console.error("Tanlovlarni yuklashda xatolik:", error);
        contestData.innerHTML = `
            <div class="text-center py-6 bg-red-50 rounded-lg">
                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
                <p class="text-red-600 font-medium">Tanlovlarni yuklashda xatolik yuz berdi</p>
                <p class="text-gray-600 text-sm mt-1">${error.message}</p>
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
        const token = getCookie('access_token');
        if (!token) throw new Error("Token topilmadi");

        const response = await fetch(`/api/contest/past/?offset=${pastContestsOffset}&limit=${pastContestsLimit}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Xatolik yuz berdi");

        const contests = data;

        if (contests.length === 0) {
            if (loadMore) showAlert('info', "Barcha tanlovlar yuklandi");
            else {
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

        // Ko'proq yuklash uchun offsetni oshiramiz
        pastContestsOffset += contests.length;

        contests.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2">${c.title}</td>
                <td class="px-4 py-2">${formatDate(c.start_time)}</td>
                <td class="px-4 py-2">${c.problem_count}</td>
                <td class="px-4 py-2">${c.contest_type}</td>
                <td class="px-4 py-2">${c.duration} daqiqa</td>
                <td class="px-4 py-2">
                    <a href="/contest/${c.id}/" class="text-indigo-600 hover:underline">Batafsil</a>
                </td>
            `;
            
            pastContestsTable.appendChild(row);
        });

        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = 'Ko‘proq yuklash';
            if (contests.length < pastContestsLimit) loadMoreBtn.classList.add('hidden');
        }

    } catch (error) {
        console.error("O'tgan tanlovlarni yuklashda xatolik:", error);
    }
}

// Statistikani yuklash
// Statistikani yuklash
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

        const token = getCookie('access_token');
        if (!token) throw new Error("Token topilmadi");

        const response = await fetch(`/api/contest/stats/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Xatolik yuz berdi");

        const stats = data;

        // Statistikani ko'rsatish
        statsContainer.innerHTML = `
        <div class="p-6 space-y-5">
            <div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700 flex items-center">
                        <i class="fas fa-trophy mr-2"></i>
                        Tanlovlar soni
                    </span>
                    <span class="text-sm font-semibold text-gray-900">
                        ${stats.total_contests !== null ? stats.total_contests : 0}
                    </span>
                </div>
            </div>
            <div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700 flex items-center">
                        <i class="fas fa-medal mr-2"></i>
                        Eng yaxshi reyting
                    </span>
                    <span class="text-sm font-semibold text-gray-900">
                        ${stats.best_rank !== null ? stats.best_rank : 'Ma’lumot yo\'q'}
                    </span>
                </div>
            </div>
            <div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700 flex items-center">
                        <i class="fas fa-chart-line mr-2"></i>
                        O'rtacha reyting
                    </span>
                    <span class="text-sm font-semibold text-gray-900">
                        ${stats.average_rank !== null ? stats.average_rank : 'Ma’lumot yo\'q'}
                    </span>
                </div>
            </div>
            <div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700 flex items-center">
                        <i class="fas fa-star mr-2"></i>
                        Jami ballar
                    </span>
                    <span class="text-sm font-semibold text-gray-900">
                        ${stats.total_points !== null ? stats.total_points : 0}
                    </span>
                </div>
            </div>
            <div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700 flex items-center">
                        <i class="fas fa-calendar-check mr-2"></i>
                        So'nggi tanlov
                    </span>
                    <span class="text-sm font-semibold text-gray-900">
                        ${stats.last_contest !== null ? formatDate(stats.last_contest) : 'Ma’lumot yo\'q'}
                    </span>
                </div>
            </div>
        </div>
        `;
    } catch (error) {
        console.error("Statistika yuklashda xatolik:", error);
        statsContainer.innerHTML = `<p class="text-red-600 text-sm">Statistika yuklanmadi: ${error.message}</p>`;
    }
}

// Sana formatlash
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uz-UZ', options);
}


// Ro'yxatdan o'tish
async function handleRegistration(event) {
    const button = event.currentTarget;
    const contestId = button.dataset.contestId;

    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Jarayonda...';
    button.disabled = true;

    try {
        const token = getCookie('access_token');
        if (!token) throw new Error("Token topilmadi");

        const response = await fetch(`/api/contest/register/?contest_id=${contestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log(data); // 👉 bu sizga aniq javobni ko‘rsatadi

        if (!response.ok) throw new Error(data.error?.message || data.detail || "Xatolik yuz berdi");

        button.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Ro\'yxatdan o\'tilgan';
        button.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600');
        button.classList.add('bg-green-100', 'text-green-800', 'hover:bg-green-200');
        showAlert('success', "Muvaffaqiyatli ro'yxatdan o'tdingiz!");

    } catch (error) {
        console.error("Ro'yxatdan o'tishda xatolik:", error);
        button.innerHTML = `<i class="fas fa-user-plus mr-2"></i> Ro'yxatdan o'tish`;
        button.disabled = false;
        showAlert('error', error.message);
    }
}

// Sana formatlash
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uz-UZ', options);
}

// Progress halqalari
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

// "Ko'proq yuklash" tugmasi uchun listener
document.querySelector('.load-more-btn')?.addEventListener('click', () => {
    fetchPastContests(true);
});
