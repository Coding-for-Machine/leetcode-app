

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