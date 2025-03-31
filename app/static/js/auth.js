const API_URL = "http://127.0.0.1:8000/api/auth";

async function apiRequest(endpoint, method, data = null, auth = false) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
        let token = localStorage.getItem("access_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await axios({
            url: `${API_URL}/${endpoint}`,
            method,
            headers,
            data
        });
        return response.data;
    } catch (error) {
        console.error(`Error in ${endpoint}:`, error.response?.data || error.message);
        return null;
    }
}

async function registerUser(username, email, password) {
    const response = await apiRequest("register", "POST", { email, username, password });
    if (response) {
        alert("Ro'yxatdan muvaffaqiyatli o'tdingiz!");
        window.location.href = "/users/login/";
    }
}

async function loginUser(email, password) {
    const response = await apiRequest("login", "POST", { email, password });
    if (response) {
        localStorage.setItem("access_token", response.access);
        localStorage.setItem("refresh_token", response.refresh);
        alert("Tizimga muvaffaqiyatli kirdingiz!");
        window.location.href = "/users/profile/";
    }
}

function logoutUser() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/users/login/";
}

async function getCurrentUser() {
    return await apiRequest("me", "GET", null, true);
}