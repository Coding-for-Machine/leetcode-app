
document.addEventListener('DOMContentLoaded', function() {
    // Avval CSS animatsiyalarni qo'shamiz
    const style = document.createElement('style');
    style.textContent = `
        .error-message {
            color: #ff6b6b;
            background: #fff5f5;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #ffcccc;
            transition: opacity 0.5s ease;
        }
        
        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes floatReverse {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(20px) rotate(-5deg); }
        }
        
        @keyframes confettiFall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Keyin DOM elementlarini topamiz
    const RegisterForm = document.getElementById('register-form');
    if (!RegisterForm) return;
    
    const submitBtn = RegisterForm.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    const API_BASE_URL = '/api';
    
    // Form submit handler
    RegisterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email')?.value;
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) {
            showError('Email va parolni kiriting');
            return;
        }
        
        // Yuklanish holati
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="loading-spinner"></span>
            <span class="btn-text">Tekshirilmoqda...</span>
        `;
        
        try {
            const response = await fetch(`${API_BASE_URL}/user/register`, {
                method: 'POST',
                credentials: 'include', // Cookie'lar uchun zarur
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 1. Access tokenni cookie'ga saqlash (1 kun muddat)
                // setCookie('access_token', data.tokens.access, 1);
                
                // // 2. Refresh tokenni cookie'ga saqlash (7 kun muddat)
                // setCookie('refresh_token', data.tokens.refresh, 7);
                
                // 3. User ma'lumotlarini localStorage'ga saqlash
                // setUser(data.user)
                
                // 4. Muvaffaqiyatli animatsiya
                submitBtn.innerHTML = `
                <svg class="success-checkmark" viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="25" fill="none" stroke="white" stroke-width="2"/>
                    <path fill="none" stroke="white" stroke-width="4" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
                <span class="btn-text">Kirish muvaffaqiyatli!</span>
                `;
                
                createConfetti();
                
                setTimeout(() => {
                    window.location.href = '/u/login/';
                }, 2000);
                
            } else {
                throw new Error(data.detail || data.message || "Kirish muvaffaqiyatsiz tugadi");
            }
        } catch (error) {
            console.error('Xatolik yuz berdi:', error);
            showError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span class="btn-text">Kirish</span>`;
        }
    });
    
    // Animatsiya funksiyalari
    function createConfetti() {
        const container = document.getElementById('particles-js');
        if (!container) return;
        
        const colors = ['#4a90e2', '#6a5acd', '#ff7f50', '#20b2aa'];
        const count = 50;
        
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'particle';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            confetti.style.width = `${Math.random() * 8 + 4}px`;
            confetti.style.height = `${Math.random() * 4 + 2}px`;
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = '-20px';
            confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear forwards`;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            container.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, (Math.random() * 3 + 2) * 1000);
        }
    }
    
    // Xatolikni ko'rsatish funksiyasi
    function showError(message) {
        let errorElement = document.getElementById('login-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'login-error';
            errorElement.className = 'error-message';
            RegisterForm.prepend(errorElement);
        }
        
        errorElement.textContent = message;
        
        setTimeout(() => {
            errorElement.style.opacity = '0';
            setTimeout(() => errorElement.remove(), 500);
        }, 5000);
    }
});




