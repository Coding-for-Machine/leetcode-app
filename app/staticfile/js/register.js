document.addEventListener('DOMContentLoaded', function() {
    // Advanced particle system
    function createParticles() {
        const container = document.getElementById('particles-js');
        const particleCount = Math.min(Math.floor(window.innerWidth / 5), 200);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random properties
            const size = Math.random() * 8 + 2;
            const posX = Math.random() * window.innerWidth;
            const posY = Math.random() * window.innerHeight;
            const opacity = Math.random() * 0.5 + 0.1;
            const delay = Math.random() * 10;
            const duration = Math.random() * 20 + 10;
            const blur = Math.random() * 2 + 0.5;
            const animationType = Math.random() > 0.5 ? 'float' : 'floatReverse';
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}px`;
            particle.style.top = `${posY}px`;
            particle.style.opacity = opacity;
            particle.style.filter = `blur(${blur}px)`;
            particle.style.animation = `${animationType} ${duration}s ease-in-out ${delay}s infinite`;
            
            // Random rotation
            particle.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            container.appendChild(particle);
        }
    }
    
    function createCodeElements() {
        const container = document.getElementById('code-elements');
        const codeSnippets = [
            "function()", "const x = 5", "return true", "import React", 
            "class Solution", "public static", "def hello():", 
            "console.log", "<?php echo", "<div>", "for(let i=0)", 
            "while(true)", "try {", "interface", "type User", 
            "db.query", "async await", "git commit", "docker run"
        ];
        
        const count = Math.min(Math.floor(window.innerWidth / 20), 50);
        
        for (let i = 0; i < count; i++) {
            const element = document.createElement('div');
            element.classList.add('code-element');
            element.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
            
            // Random properties
            const size = Math.random() * 14 + 10;
            const posX = Math.random() * window.innerWidth;
            const posY = Math.random() * window.innerHeight;
            const opacity = Math.random() * 0.3 + 0.1;
            const delay = Math.random() * 15;
            const duration = Math.random() * 25 + 15;
            const rotation = Math.random() * 15 - 7.5;
            const animationType = Math.random() > 0.5 ? 'float' : 'floatReverse';
            
            element.style.fontSize = `${size}px`;
            element.style.left = `${posX}px`;
            element.style.top = `${posY}px`;
            element.style.opacity = opacity;
            element.style.transform = `rotate(${rotation}deg)`;
            element.style.animation = `${animationType} ${duration}s ease-in-out ${delay}s infinite`;
            
            container.appendChild(element);
        }
    }
    
    // Initialize animations
    createParticles();
    createCodeElements();
    
    // Octocat wave animation
    const octocatArm = document.querySelector('.octocat-arm');
    if (octocatArm) {
        octocatArm.style.animation = 'none';
        
        const octocat = document.querySelector('.octocat');
        octocat.addEventListener('mouseenter', function() {
            octocatArm.style.animation = 'wave 560ms ease-in-out infinite';
            octocat.style.animation = 'octocatFloat 3s ease-in-out infinite';
        });
        
        octocat.addEventListener('mouseleave', function() {
            octocatArm.style.animation = 'none';
            octocat.style.animation = 'floatReverse 9s ease-in-out infinite';
        });
    }
    
    // Form submission handler
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            `;
            submitBtn.disabled = true;
            
            const register_username = document.getElementById("register-username").value;
            const register_email = document.getElementById("register-email").value;
            const register_password = document.getElementById("register-password").value;
            
            if (register_password.length < 8) {
                alert("Parol kamida 8 ta belgidan iborat bo'lishi kerak!");
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            if (register_email.length < 8 || !register_email.endsWith("@gmail.com")) {
                alert("Email noto'g'ri kiritilgan!");
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            try {
                await registerUser(register_username, register_email, register_password);
            } catch (error) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                alert("Xatolik yuz berdi: " + error.message);
            }
        });
    }
    
    // Input focus animations
    const inputs = document.querySelectorAll('.github-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.querySelector('label').classList.add('text-orange-500', 'font-semibold');
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.querySelector('label').classList.remove('text-orange-500', 'font-semibold');
        });
    });
    
    // Social button hover effects
    const socialButtons = document.querySelectorAll('.github-input');
    socialButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
});