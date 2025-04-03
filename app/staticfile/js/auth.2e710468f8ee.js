// API asosiy manzili
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Xatolarni ko'rsatish uchun funksiya
function showError(message, elementId = "error-message") {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    } else {
        alert(message);
    }
}

// Muvaffaqiyatli xabarlar uchun funksiya
function showSuccess(message, elementId = "success-message") {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.remove('hidden');
        setTimeout(() => {
            successElement.classList.add('hidden');
        }, 5000);
    } else {
        alert(message);
    }
}

// Form xatolarini ko'rsatish
function showFormErrors(errors) {
    // Avvalgi xatolarni tozalash
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    document.querySelectorAll('.invalid-feedback').forEach(el => {
        el.textContent = '';
    });

    // Yangi xatolarni ko'rsatish
    for (const [field, message] of Object.entries(errors)) {
        const input = document.getElementById(field);
        const feedback = document.getElementById(`${field}-feedback`);
        
        if (input) input.classList.add('is-invalid');
        if (feedback) feedback.textContent = message;
    }
}

// Token muddatini tekshirish
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true;
    }
}

// Token yangilash funksiyasi
async function refreshToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
        logoutUser();
        return null;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh`, {
            refresh: refreshToken
        });
        
        if (response.data.access) {
            localStorage.setItem("access_token", response.data.access);
            return response.data.access;
        }
    } catch (error) {
        console.error("Token yangilashda xatolik:", error);
        logoutUser();
    }
    return null;
}

// API so'rovlari uchun asosiy funksiya
async function apiRequest(endpoint, method, data = null, auth = false) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/${endpoint}`;
    const headers = { "Content-Type": "application/json" };
    
    if (auth) {
        let token = localStorage.getItem("access_token");
        
        // Token muddati tugagan bo'lsa, yangilash
        if (token && isTokenExpired(token)) {
            token = await refreshToken();
            if (!token) {
                showError("Sessiya muddati tugadi. Iltimos, qaytadan kiring.");
                return { success: false, error: "Avtorizatsiya talab qilinadi" };
            }
        }
        
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await axios({
            url,
            method,
            headers,
            data,
            validateStatus: function (status) {
                return status < 500;
            }
        });

        if (response.status >= 300) {
            const errorData = {
                status: response.status,
                data: response.data,
                message: response.data?.detail || 
                        response.data?.message || 
                        `So'rovda xatolik (${response.status})`
            };
            return { success: false, error: errorData };
        }

        return { success: true, data: response.data };
        
    } catch (error) {
        const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          "Tarmoq xatosi. Iltimos, internet aloqasini tekshiring";
        
        console.error(`API Xato [${endpoint}]:`, error);
        return { 
            success: false, 
            error: {
                status: error.response?.status || 0,
                data: error.response?.data,
                message: errorMessage
            }
        };
    }
}

// Auth holatini tekshirish va UI ni yangilash
function checkAuthState() {
    const token = localStorage.getItem('access_token');
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const currentPath = window.location.pathname;
    
    if (authButtons && userMenu) {
        if (token) {
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';
            getCurrentUser();
            
            // Agar login/register sahifasida bo'lsa, asosiy sahifaga yo'naltirish
            if (currentPath === '/u/login/' || currentPath === '/u/register/') {
                window.location.href = '/';
            }
        } else {
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
            
            // Agar profil sahifasida bo'lsa va token yo'q bo'lsa
            if (currentPath.startsWith('/u/profile/')) {
                window.location.href = '/u/login/';
            }
        }
    }
}

// Foydalanuvchi ma'lumotlarini olish va UI ni yangilash
async function getCurrentUser() {
    const result = await apiRequest("auth/me", "GET", null, true);
    
    if (result.success) {
        // Desktop view
        const profileImage = document.getElementById('profile-image');
        const usernameDisplay = document.getElementById('username-display');
        
        if (profileImage && result.data.profile_image) {
            profileImage.src = result.data.profile_image;
        }
        if (usernameDisplay) {
            usernameDisplay.textContent = result.data.username;
        }
        
        // Mobile view
        const mobileProfileImage = document.getElementById('mobile-profile-image');
        const mobileUsername = document.getElementById('mobile-username');
        if (mobileProfileImage && result.data.profile_image) {
            mobileProfileImage.src = result.data.profile_image;
        }
        if (mobileUsername) {
            mobileUsername.textContent = result.data.username;
        }
        
        return result.data;
    }
    return null;
}

// Ro'yxatdan o'tish funksiyasi
async function registerUser(formData) {
    // Frontend validatsiya
    const errors = {};
    
    if (!formData.username) errors.username = "Username kiritilishi shart";
    else if (formData.username.length < 4) errors.username = "Username kamida 4 belgidan iborat bo'lishi kerak";
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) errors.username = "Username faqat harflar, raqamlar va _ belgisidan iborat bo'lishi kerak";
    
    if (!formData.email) errors.email = "Email kiritilishi shart";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Noto'g'ri email formati";
    
    if (!formData.password) errors.password = "Parol kiritilishi shart";
    else if (formData.password.length < 8) errors.password = "Parol kamida 8 belgidan iborat bo'lishi kerak";
    else if (!/[A-Z]/.test(formData.password)) errors.password = "Parol kamida 1 ta bosh harfdan iborat bo'lishi kerak";
    else if (!/[a-z]/.test(formData.password)) errors.password = "Parol kamida 1 ta kichik harfdan iborat bo'lishi kerak";
    else if (!/[0-9]/.test(formData.password)) errors.password = "Parol kamida 1 ta raqamdan iborat bo'lishi kerak";
    
    if (Object.keys(errors).length > 0) {
        showFormErrors(errors);
        return { success: false };
    }
    
    const result = await apiRequest("auth/register", "POST", formData);
    
    if (result.success) {
        showSuccess("Ro'yxatdan muvaffaqiyatli o'tdingiz!");
        
        // Agar token qaytgan bo'lsa
        if (result.data && result.data.access) {
            localStorage.setItem('access_token', result.data.access);
            localStorage.setItem('refresh_token', result.data.refresh);
            
            // Foydalanuvchi ma'lumotlarini olish
            const userData = await getCurrentUser();
            const username = userData ? userData.username : '';
            
            setTimeout(() => window.location.href = `/u/profile/${username}`, 1500);
        } else {
            setTimeout(() => window.location.href = '/u/login/', 1500);
        }
        
        return { success: true };
    } else {
        handleBackendErrors(result.error, {
            username: document.getElementById('username'),
            email: document.getElementById('email'),
            password: document.getElementById('password')
        });
        return { success: false };
    }
}

// Tizimga kirish funksiyasi
async function loginUser(formData) {
    const errors = {};
    
    if (!formData.email) errors.email = "Email kiritilishi shart";
    if (!formData.password) errors.password = "Parol kiritilishi shart";
    
    if (Object.keys(errors).length > 0) {
        showFormErrors(errors);
        return { success: false };
    }
    
    const result = await apiRequest("auth/login", "POST", formData);
    
    if (result.success && result.data.access) {
        localStorage.setItem("access_token", result.data.access);
        localStorage.setItem("refresh_token", result.data.refresh);
        
        showSuccess("Muvaffaqiyatli kirdingiz!");
        
        // Foydalanuvchi ma'lumotlarini olish
        const userData = await getCurrentUser();
        const username = userData ? userData.username : '';
        
        // Oldingi sahifaga qaytish yoki profilga yo'naltirish
        const returnUrl = new URLSearchParams(window.location.search).get('return') || `/u/profile/${username}`;
        setTimeout(() => window.location.href = returnUrl, 1000);
        
        return { success: true };
    } else {
        showError(result.error?.message || "Email yoki parol noto'g'ri");
        return { success: false };
    }
}

// Tizimdan chiqish funksiyasi
async function logoutUser() {
    try {
        await apiRequest("auth/logout", "POST", null, true);
    } catch (e) {
        console.error("Logout xatosi:", e);
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/u/login/";
}

// Backend xatolarini boshqarish
function handleBackendErrors(error, fieldsMap = {}) {
    console.error('Backend xatosi:', error);
    
    if (error.status === 400 && error.data) {
        const fieldErrors = {};
        
        for (const [field, messages] of Object.entries(error.data)) {
            const fieldName = field in fieldsMap ? field : null;
            
            if (fieldName) {
                fieldErrors[fieldName] = Array.isArray(messages) ? messages.join(', ') : messages;
            }
        }
        
        if (Object.keys(fieldErrors).length > 0) {
            showFormErrors(fieldErrors);
        } else {
            showError(error.message);
        }
    } else if (error.status === 401 || error.status === 403) {
        showError("Kirish mumkin emas. Iltimos, qaytadan kiring.");
        logoutUser();
    } else if (error.status >= 500) {
        showError("Serverda xatolik yuz berdi. Iltimos, keyinroq urunib ko'ring.");
    } else {
        showError(error.message);
    }
}

// Profil ma'lumotlarini yuklash
async function loadProfile(username) {
    const result = await apiRequest(`users/profile/${username}`, "GET", null, true);
    
    if (result.success) {
        // Profil ma'lumotlarini ko'rsatish
        document.getElementById('profile-username').textContent = result.data.username;
        document.getElementById('profile-email').textContent = result.data.email;
        document.getElementById('profile-joined').textContent = new Date(result.data.date_joined).toLocaleDateString();
        
        if (result.data.profile_image) {
            document.getElementById('profile-image-large').src = result.data.profile_image;
        }
        
        return result.data;
    } else {
        showError(result.error?.message || "Profil ma'lumotlarini yuklab bo'lmadi");
        return null;
    }
}

// DOM yuklanganda ishlaydigan funksiyalar
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    
    // Registratsiya formasi
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };
        await registerUser(formData);
    });

    // Login formasi
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };
        await loginUser(formData);
    });

    // Logout tugmasi
    document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await logoutUser();
    });

    // Profil sahifasi yuklanganda
    if (window.location.pathname.startsWith('/u/profile/')) {
        const username = window.location.pathname.split('/').pop();
        if (username) {
            loadProfile(username);
        } else {
            // Agar username bo'lmasa, joriy foydalanuvchi profiliga yo'naltirish
            getCurrentUser().then(user => {
                if (user && user.username) {
                    window.location.href = `/u/profile/${user.username}`;
                } else {
                    window.location.href = '/u/login/';
                }
            });
        }
    }
});