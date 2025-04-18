
const DAY = 1;

const API_BASE_URL = "http://127.0.0.1:8000/api";

const headers = {
    "Content-Type": "application/json"
}

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true;
    }
}

async function refreshToken() {
    const refreshToken = getCookie("refresh_token");
    if (!refreshToken) {
        logoutUser();
        return null;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/auth/token/refresh`,{
            method: "POST",
            headers,
            body: getCookie()
        });
        if (response.data.access){
            setCookie("access_token", response.data.access, DAY)
        }
    } catch (error) {
        console.error("Token yangilashda xatolik:", error);
        logoutUser();
    }
}
export async function apiRequest(endpoint, method, data=null, auth=false) {
    const url = `${API_BASE_URL}/${endpoint}`;
    if (auth) {
        let token = getCookie("access_token");
        if (token && isTokenExpired(token)){
            token = await refreshToken();
            if (!token){
                showError("Sessiya muddati tugadi. Iltimos, qaytadan kiring.");
                return {succsess: false, error: "Avtorizatsiya talab qilinadi" };
            }
        }
        headers["Authorization"] = `Bearer ${token}`
    }
    try {
        const response = await fetch({
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