const API_URL = "http://127.0.0.1:8000/api/auth";

// ✅ Umumiy API so‘rovi funksiyasi
async function apiRequest(endpoint, method, data = null, auth = false) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
        let token = localStorage.getItem("access_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await axios({
            url: `${API_URL}/${endpoint}/`,
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

// ✅ Ro‘yxatdan o‘tish (register)
async function registerUser(username, email, password) {
    const response = await apiRequest("register", "POST", { username, email, password });
    if (response) {
        alert("Ro‘yxatdan muvaffaqiyatli o‘tdingiz!");
        window.location.href = "/users/login/";
    }
}

// ✅ Login qilish
async function loginUser(email, password) {
    const response = await apiRequest("login", "POST", { email, password });  // 🔥 TO‘G‘RILANDI
    if (response) {
        localStorage.setItem("access_token", response.access);
        localStorage.setItem("refresh_token", response.refresh);
        alert("Tizimga muvaffaqiyatli kirdingiz!");
        window.location.href = "/users/profile/";
    }
}

// ✅ Logout qilish
function logoutUser() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/users/login/";
}

// ✅ Joriy foydalanuvchini olish
async function getCurrentUser() {
    return await apiRequest("me", "GET", null, true);
}

// -------------------------------------- Login ----------------------------
// document.addEventListener("DOMContentLoaded", function () {
//     let loginForm = document.getElementById("login-form");
//     if (loginForm) {
//         loginForm.addEventListener("submit", async function (event) {
//             event.preventDefault();

//             let login_email = document.getElementById("login-email").value;
//             let login_password = document.getElementById("login-password").value;

//             if (login_password.length < 8) {
//                 alert("Parol kamida 8 ta belgidan iborat bo‘lishi kerak!");
//                 return;
//             }
//             if (login_email.length < 8 || !login_email.endsWith("@gmail.com")) {
//                 alert("Email noto‘g‘ri kiritilgan!");
//                 return;
//             }

//             await loginUser(login_email, login_password);
//         });
//     }
// });

// ------------------- Register ------------------------

