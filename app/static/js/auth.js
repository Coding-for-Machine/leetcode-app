// auth.js

async function refreshToken() {
    try {
        const response = await fetch('/api/auth/refresh/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        if (!response.ok) throw new Error('Token yangilash muvaffaqiyatsiz');
        return true;
    } catch (error) {
        console.error('Token yangilashda xatolik:', error);
        return false;
    }
}

async function makeAuthRequest(url, options = {}) {
    let response = await fetch(url, {
        ...options,
        credentials: 'include'
    });
    
    // Agar 401 xatolik bo'lsa, token yangilab ko'ramiz
    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            response = await fetch(url, {
                ...options,
                credentials: 'include'
            });
        } else {
            window.location.href = '/u/login/';
            return;
        }
    }
    
    return response;
}