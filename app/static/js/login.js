
export async function loginUser(formData) {
    const errors = {};
    
    if (!formData.email) errors.email = "Email kiritilishi shart";
    if (!formData.password) errors.password = "Parol kiritilishi shart";
    
    if (Object.keys(errors).length > 0) {
        showFormErrors(errors);
        return { success: false };
    }
    
    const result = await apiRequest("user/login", "POST", formData);
    
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

document.addEventListener('DOMContentLoaded', function() {
    // Animatsion elementlarni yaratish
    createParticles();
    createCodeElements();
    
    // Formani qo'shish
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = this.querySelector('button[type="submit"]');
        console.log(email, password, submitBtn)
        // Loading holati
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="loading-spinner"></span>
            <span class="btn-text">Tekshirilmoqda...</span>
        `;
        
        try {
            const result = await loginUser({email: email, password: password});
            
            if (result.success) {
                submitBtn.innerHTML = `
                    <svg class="success-checkmark" viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r="25" fill="none" stroke="white" stroke-width="2"/>
                        <path fill="none" stroke="white" stroke-width="4" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <span class="btn-text">Kirish muvaffaqiyatli!</span>
                `;
                
                // Animatsiyalar
                createConfetti();
                
                // API javobi muvaffaqiyatli bo'lsa, u o'zi yo'naltiradi
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span class="btn-text">Kirish</span>`;
            }
        } catch (error) {
            console.error('Xatolik yuz berdi:', error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span class="btn-text">Kirish</span>`;
            alert('Xatolik yuz berdi: ' + (error.message || 'Noma\'lum xatolik'));
        }
    });
    
    
    // Animatsion elementlarni yaratish funksiyalari
    function createParticles() {
        const container = document.getElementById('particles-js');
        const count = Math.min(Math.floor(window.innerWidth / 10), 100);
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Tasodifiy xususiyatlar
            particle.style.width = `${Math.random() * 10 + 5}px`;
            particle.style.height = particle.style.width;
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.top = `${Math.random() * 100}vh`;
            particle.style.opacity = Math.random() * 0.6 + 0.2;
            particle.style.animation = `float ${Math.random() * 10 + 5}s linear infinite`;
            
            container.appendChild(particle);
        }
    }
    
    function createCodeElements() {
        const container = document.getElementById('code-elements');
        const snippets = ["function()", "const x = 5", "return true", "console.log"];
        const count = Math.min(Math.floor(window.innerWidth / 15), 30);
        
        for (let i = 0; i < count; i++) {
            const element = document.createElement('div');
            element.className = 'code-element';
            element.textContent = snippets[Math.floor(Math.random() * snippets.length)];
            
            // Tasodifiy xususiyatlar
            element.style.fontSize = `${Math.random() * 12 + 10}px`;
            element.style.left = `${Math.random() * 100}vw`;
            element.style.top = `${Math.random() * 100}vh`;
            element.style.opacity = Math.random() * 0.4 + 0.1;
            element.style.animation = `floatReverse ${Math.random() * 15 + 5}s linear infinite`;
            
            container.appendChild(element);
        }
    }
    
    function createConfetti() {
        const container = document.getElementById('particles-js');
        const colors = ['#4a90e2', '#6a5acd', '#ff7f50', '#20b2aa'];
        const count = 50;
        
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'particle';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Tasodifiy xususiyatlar
            confetti.style.width = `${Math.random() * 8 + 4}px`;
            confetti.style.height = `${Math.random() * 4 + 2}px`;
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = '-20px';
            confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear forwards`;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            container.appendChild(confetti);
            
            // Animatsiyadan keyin olib tashlash
            setTimeout(() => {
                confetti.remove();
            }, (Math.random() * 3 + 2) * 1000);
        }
    }
});

// CSS animatsiyalari
const style = document.createElement('style');
style.textContent = `
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