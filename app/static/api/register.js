import { setCookie } from "../js/cookie";


async function registerUser(formData) {
    const errors = {};
    if (!formData.username) errors.username = "Username kiritilishi shart";
    else if (formData.username.length < 4) errors.username = "Username kamida 4 belgidan iborat bo'lishi kerak";
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) errors.username = "Username faqat harflar, raqamlar va _ belgisidan iborat bo'lishi kerak";
    if (!formData.email) errors.email = "Email kiritilishi shart";
    else if (formData.email.length < 4) errors.username = "Email kamida 4 belgidan iborat bo'lishi kerak";
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
    const result = await apiRequest("user/register", "POST", formData);
    if (result.success) {
        showSuccess("Ro'yxatdan muvaffaqiyatli o'tdingiz!");
        if (result.data && result.data.access) {
            setCookie('access_token', result.data.access, DAY);
            setCookie('refresh_token', result.data.refresh, DAY);
            setTimeout(() => window.location.href = `/`, 1500);
        } else {
            setTimeout(() => window.location.href = '/u/login/', 1500);
        }
        handleBackendErrors(result.error, {
            username: document.getElementById('username'),
            email: document.getElementById('email'),
            password: document.getElementById('password')
        });
        return { success: false };
    }
}