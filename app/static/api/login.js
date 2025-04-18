import { apiRequest } from "../js/auth";

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