// profile.js

const token = getCookie("access_token")
console.log("Profile")
document.addEventListener('DOMContentLoaded', function() {
    // API bazasi URL
    console.log("Ishga tushdi")
    const apiBaseUrl = '/api/activaty/';
    
    // State management
    const state = {
        user: null,
        activities: [],
        badges: [],
        solvedProblems: [],
        stats: null,
        contributions: [],
        currentTab: 'overview',
        selectedYear: new Date().getFullYear()
    };
    
    // DOM Elements
    const elements = {
        profileHeader: document.querySelector('.gradient-bg'),
        activityChart: document.getElementById('skillsChart'),
        contributionGrid: document.getElementById('grid'),
        monthsContainer: document.getElementById('oylar'),
        contributionsCount: document.getElementById('hissalar-soni'),
        tabs: {
            container: document.querySelector('.flex.overflow-x-auto'),
            contents: document.querySelectorAll('.tab-content')
        },
        editProfileModal: document.getElementById('edit-profile-modal')
    };
    
    // API Functions (HTTP-only cookie bilan ishlaydi)
    const api = {
        fetchUserProfile: async () => {
            const response = await fetch(`/api/user/me/`, {
                method: "GIT",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            return await response.json();
        },
        
        fetchUserActivities: async () => {
            
            const response = await fetch(`${apiBaseUrl}activities`, {
                method: "GIT",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) throw new Error('Failed to fetch activities');
            return await response.json();
        },
        
        fetchUserBadges: async () => {
            
            const response = await fetch(`${apiBaseUrl}badges`, {
                method: "GIT",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) throw new Error('Failed to fetch badges');
            return await response.json();
        },
        
        fetchSolvedProblems: async () => {
            
            const response = await fetch(`${apiBaseUrl}problems`, {
                method: "GIT",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) throw new Error('Failed to fetch problems');
            return await response.json();
        },
        
        fetchUserStats: async () => {
            const response = await fetch(`${apiBaseUrl}stats`, {
                method: "GIT",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        },
        
        fetchContributions: async (year) => {
            const response = await fetch(`${apiBaseUrl}contributions/?year=${year}`, {
                method: "GIT",
                credentials: 'include', // Cookie'lar uchun zarur
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) throw new Error('Failed to fetch contributions');
            return await response.json();
        },
        
        updateProfile: async (data) => {
            const response = await fetch(`${apiBaseUrl}update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update profile');
            return await response.json();
        }
    };
    
    // Helper functions
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
    
    function getColorClass(count) {
        if (count === 0) return 'bg-gray-100';
        if (count < 5) return 'bg-green-100';
        if (count < 10) return 'bg-green-300';
        if (count < 20) return 'bg-green-500';
        return 'bg-green-700';
    }
    
    function formatDate(dateStr) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('uz-UZ', options);
    }
    
    // Authentication check
    async function checkAuth() {
        try {
            // Simple check by fetching profile
            if (getCookie()){
                return True
            }
        } catch (error) {
            console.error('Authentication error:', error);
            window.location.href = '/u/login/';
            return false;
        }
    }
    
    // Render functions
    const render = {
        profileHeader: (user) => {
            const header = elements.profileHeader;
            if (!header) return;
            
            header.querySelector('h1').textContent = user.username;
            header.querySelector('p:nth-of-type(1)').textContent = `@${user.username}`;
            header.querySelector('p:nth-of-type(2)').textContent = user.bio || 'No bio yet';
            
            // Render skills
            const skillsContainer = header.querySelector('.flex.flex-wrap.gap-2');
            if (skillsContainer && user.skills) {
                skillsContainer.innerHTML = user.skills.map(skill => 
                    `<span class="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs md:text-sm">${skill}</span>`
                ).join('');
            }
            
            // Render stats
            if (user.stats) {
                const stats = [
                    { value: user.stats.followers || 0, label: 'Obunachilar' },
                    { value: user.stats.following || 0, label: 'Kuzatuvchilar' },
                    { value: user.stats.solved || 0, label: 'Yechilgan' },
                    { value: user.stats.contests || 0, label: 'Tanlovlar' }
                ];
                
                const statsContainer = header.querySelector('.flex.flex-wrap.justify-between');
                if (statsContainer) {
                    statsContainer.innerHTML = stats.map(stat => `
                        <div class="text-center mb-4 md:mb-0">
                            <div class="text-xl md:text-2xl font-bold">${stat.value}</div>
                            <div class="text-xs md:text-sm opacity-80">${stat.label}</div>
                        </div>
                    `).join('');
                }
            }
        },
        
        skillsChart: (problems) => {
            if (!elements.activityChart) return;
            
            // Group by language
            const languages = problems.reduce((acc, problem) => {
                const lang = problem.language || 'Other';
                acc[lang] = (acc[lang] || 0) + 1;
                return acc;
            }, {});
            
            const data = {
                labels: Object.keys(languages),
                datasets: [{
                    data: Object.values(languages),
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#E5E7EB'
                    ],
                    borderWidth: 0
                }]
            };
            
            new Chart(elements.activityChart, {
                type: 'doughnut',
                data: data,
                options: {
                    cutout: '70%',
                    plugins: {
                        legend: { display: false }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
        },
        
        contributions: (data) => {
            if (!elements.contributionGrid || !elements.monthsContainer) return;
            
            // Clear previous content
            elements.contributionGrid.innerHTML = '';
            elements.monthsContainer.innerHTML = '';
            
            // Update count
            elements.contributionsCount.textContent = 
                `${state.selectedYear} yilda ${data.total} ta hissa`;
            
            // Render months
            const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", 
                              "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
            
            data.calendar.forEach(monthData => {
                const monthDiv = document.createElement('div');
                monthDiv.textContent = monthNames[monthData.month - 1];
                monthDiv.style.marginRight = '8px';
                elements.monthsContainer.appendChild(monthDiv);
            });
            
            // Render grid
            let html = '';
            for (let i = 0; i < 7; i++) {
                data.calendar.forEach(month => {
                    month.days.forEach(day => {
                        if (new Date(day.date).getDay() === i) {
                            html += `
                                <div class="w-2 h-2 md:w-3 md:h-3 rounded-sm cursor-pointer ${getColorClass(day.count)}"
                                     title="${formatDate(day.date)}: ${day.count} ta hissa">
                                </div>
                            `;
                        }
                    });
                });
            }
            
            elements.contributionGrid.innerHTML = html;
        },
        
        solvedProblems: (problems) => {
            const tableBody = document.querySelector('.masala-jadval tbody');
            if (!tableBody) return;
            
            tableBody.innerHTML = problems.map(problem => `
                <tr class="hover:bg-gray-50">
                    <td class="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div class="text-xs md:text-sm font-medium text-gray-900">
                            ${problem.problem.title}
                        </div>
                    </td>
                    <td class="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span class="${getDifficultyClass(problem.difficulty)} px-2 py-1 text-xs rounded-full">
                            ${problem.difficulty}
                        </span>
                    </td>
                    <td class="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 tezlik-cell">
                        ${problem.time_taken}
                    </td>
                    <td class="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                        ${problem.memory_used}
                    </td>
                </tr>
            `).join('');
            
            function getDifficultyClass(difficulty) {
                switch (difficulty.toLowerCase()) {
                    case 'easy': return 'bg-green-100 text-green-800';
                    case 'medium': return 'bg-yellow-100 text-yellow-800';
                    case 'hard': return 'bg-red-100 text-red-800';
                    default: return 'bg-gray-100 text-gray-800';
                }
            }
        },
        
        badges: (badges) => {
            const badgesContainer = document.querySelector('.grid.grid-cols-3.gap-3');
            if (!badgesContainer) return;
            
            badgesContainer.innerHTML = badges.map(badge => `
                <div class="flex flex-col items-center">
                    <div class="relative w-12 h-12 md:w-16 md:h-16 mb-2">
                        <div class="nishon-progress rounded-full w-full h-full flex items-center justify-center" 
                             style="--progress: ${badge.progress}%">
                            <div class="bg-white rounded-full w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                                <i class="${badge.badge.icon} text-lg" style="color: ${badge.badge.color}"></i>
                            </div>
                        </div>
                    </div>
                    <span class="text-xs text-center font-medium">${badge.badge.name}</span>
                </div>
            `).join('');
        },
        
        stats: (stats) => {
            // Update progress bars
            const totalSolved = stats.total_solved;
            const maxProblems = 2000;
            
            document.querySelectorAll('.progress-ring__circle').forEach(circle => {
                const percent = (totalSolved / maxProblems) * 100;
                circle.style.strokeDashoffset = 100 - percent;
            });
            
            // Update stats numbers
            document.querySelectorAll('.w-full.bg-gray-200').forEach(bar => {
                const type = bar.parentElement.querySelector('span:first-child').textContent;
                let percent = 0;
                
                if (type.includes('Jami')) {
                    percent = (totalSolved / maxProblems) * 100;
                } else if (type.includes('Oson')) {
                    percent = (stats.easy_solved / 500) * 100;
                } else if (type.includes('Oʻrtacha')) {
                    percent = (stats.medium_solved / 1000) * 100;
                } else if (type.includes('Qiyin')) {
                    percent = (stats.hard_solved / 500) * 100;
                }
                
                bar.querySelector('div').style.width = `${percent}%`;
            });
        }
    };
    
    // Tab management
    function setupTabs() {
        const tabs = elements.tabs.container.querySelectorAll('.tab-btn');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('tab-faol'));
                this.classList.add('tab-faol');
                
                elements.tabs.contents.forEach(content => content.classList.add('hidden'));
                
                const tabId = this.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.remove('hidden');
                
                state.currentTab = this.getAttribute('data-tab');
            });
        });
        
        if (tabs.length > 0) tabs[0].click();
    }
    
    // Modal management
    function setupModals() {
        // Edit profile modal
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const modal = document.getElementById('edit-profile-modal');
        
        if (editProfileBtn && modal) {
            editProfileBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
                populateEditForm();
            });
            
            closeModalBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }
    }
    
    function populateEditForm() {
        if (!state.user) return;
        
        const form = document.querySelector('#edit-profile-modal form');
        if (!form) return;
        
        form.querySelector('#name').value = state.user.username;
        form.querySelector('#username').value = state.user.username;
        form.querySelector('#bio').value = state.user.bio || '';
        
        // Skills
        const skillsContainer = form.querySelector('.flex.flex-wrap.gap-1');
        if (skillsContainer && state.user.skills) {
            skillsContainer.innerHTML = state.user.skills.map(skill => `
                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                    ${skill} <button class="ml-1 text-blue-500 hover:text-blue-700"><i class="fas fa-times text-xs"></i></button>
                </span>
            `).join('') + `
                <button class="text-indigo-600 hover:text-indigo-700 text-xs flex items-center">
                    <i class="fas fa-plus mr-1"></i> Ko'nikma qo'shish
                </button>
            `;
        }
    }
    
    // Year selector
    function setupYearSelector() {
        const yearSelector = document.getElementById('year-selector');
        if (!yearSelector) return;
        
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 2; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            option.selected = year === currentYear;
            yearSelector.appendChild(option);
        }
        
        yearSelector.addEventListener('change', async () => {
            state.selectedYear = parseInt(yearSelector.value);
            await loadContributions();
        });
    }
    
    // Data loading functions
    async function loadProfile() {
        try {
            state.user = await api.fetchUserProfile();
            render.profileHeader(state.user);
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }
    
    async function loadActivities() {
        try {
            state.activities = await api.fetchUserActivities();
        } catch (error) {
            console.error('Failed to load activities:', error);
        }
    }
    
    async function loadBadges() {
        try {
            state.badges = await api.fetchUserBadges();
            render.badges(state.badges);
        } catch (error) {
            console.error('Failed to load badges:', error);
        }
    }
    
    async function loadSolvedProblems() {
        try {
            state.solvedProblems = await api.fetchSolvedProblems();
            render.solvedProblems(state.solvedProblems);
            
            if (elements.activityChart) {
                render.skillsChart(state.solvedProblems);
            }
        } catch (error) {
            console.error('Failed to load solved problems:', error);
        }
    }
    
    async function loadStats() {
        try {
            state.stats = await api.fetchUserStats();
            render.stats(state.stats);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }
    
    async function loadContributions() {
        try {
            const data = await api.fetchContributions(state.selectedYear);
            state.contributions = data;
            render.contributions(data);
        } catch (error) {
            console.error('Failed to load contributions:', error);
        }
    }
    
    // Initialize everything
    async function init() {
        // Check authentication first
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;
        
        setupTabs();
        setupModals();
        setupYearSelector();
        
        // Load all data
        await Promise.all([
            loadProfile(),
            loadActivities(),
            loadBadges(),
            loadSolvedProblems(),
            loadStats(),
            loadContributions()
        ]);
    }
    
    init();
});