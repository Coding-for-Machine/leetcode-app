// DOM tayyor bo'lganda ishlaydigan asosiy event listener
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadProblemData();
        initCodeEditor();
        setupResizeHandler();
        setupSubmitButton();
    } catch (error) {
        console.error("Xatolik yuz berdi:", error);
        showConsoleError("Muammo ma'lumotlarini yuklashda xatolik yuz berdi.");
    }
});

let currentProblem = null;
let editor = null;
let func = null;
let isSubmitting = false; // Yuklash holatini kuzatish
const testResults = []; // Test natijalari
const problemDescription = document.getElementById("problem-description");
const consolePanel = document.getElementById("console-panel");
const path = window.location.pathname;
const slug = path.split('/').filter(Boolean).pop();

const token = getCookie("access_token");
const PROBLEM_API = `http://127.0.0.1:8000/api/problems/${slug}/`;
const SOLUTION_API = 'http://127.0.0.1:8000/api/solution/create/';
const LOGIN_URL = '/u/login';

// Submit tugmasini sozlash
function setupSubmitButton() {
    const BtnYuborish = document.getElementById("btn-yuborish");
    
    // Avvalgi event listenerlarni olib tashlash
    BtnYuborish.removeEventListener("click", handleSubmit);
    
    // Yangi event listener qo'shish (debounce bilan)
    BtnYuborish.addEventListener("click", debounce(handleSubmit, 1000));
}

// Debounce funktsiyasi (tez-tez bosishni oldini olish)
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Submitni boshqarish
async function handleSubmit() {
    // Token mavjudligini tekshirish
    if (!token) {
        showAlert('error', "Yechim yuborish uchun tizimga kiring?", () => {
            window.location.href = LOGIN_URL;
        });
        return;
    }

    if (isSubmitting) {
        console.log("Yuborish jarayoni davom etmoqda...");
        return;
    }

    const BtnYuborish = document.getElementById("btn-yuborish");
    const originalText = BtnYuborish.innerText;
    
    try {
        isSubmitting = true;
        BtnYuborish.innerText = "Yuborilmoqda...";
        BtnYuborish.disabled = true;
        
        await SubmitCode();
    } catch (error) {
        console.error("Yuborishda xatolik:", error);
        showConsoleError(`Yuborishda xatolik: ${error.message}`);
    } finally {
        isSubmitting = false;
        BtnYuborish.innerText = originalText;
        BtnYuborish.disabled = false;
    }
}

// Kodni yuborish funksiyasi
async function SubmitCode() {
    try {
        if (!currentProblem) {
            throw new Error("Muammo tanlanmagan");
        }

        showConsole();
        clearConsole();
        testResults.length = 0; // Oldingi natijalarni tozalash

        const languageId = document.getElementById('language-select').value;
        const code = editor.getValue();

        const data = {
            language_id: languageId,
            problem_id: currentProblem,
            code: code,
        };
        localStorage.setItem("code", JSON.stringify(data))
        const response = await fetch(SOLUTION_API, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            // Agar 401 Unauthorized xatosi bo'lsa (token eskirgan/yaroqsiz)
            if (response.status === 401) {
                showAlert('error', "Sizning sessiyangiz tugagan. Yangidan login qilasizmi?", () => {
                    window.location.href = LOGIN_URL;
                });
                return;
            }
            throw new Error(`Server xatosi: ${response.status}`);
        }
        showAlert('success', "Yechiminggiz serverga yuborildi!");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const parsed = JSON.parse(line);
                    displayTestResult(parsed);
                } catch (e) {
                    console.warn("JSON parse error:", line);
                    addConsoleMessage(`⚠️ Xato: ${line}`, 'text-yellow-400');
                }
            }
        }

        if (buffer.trim()) {
            try {
                const lastParsed = JSON.parse(buffer);
                displayTestResult(lastParsed);
            } catch (e) {
                console.warn("Final JSON parse error:", buffer);
                addConsoleMessage(`⚠️ Final xato: ${buffer}`, 'text-yellow-400');
            }
        }

        drawChart();
    } catch (error) {
        console.error('Yuborishda xatolik:', error);
        addConsoleMessage(`❌ Xatolik: ${error.message}`, 'text-red-500');
        throw error;
    }
}

// Cookie olish funksiyasi
// function getCookie(name) {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop().split(';').shift();
// }

// Qolgan funksiyalar (loadProblemData, initCodeEditor, displayTestResult, drawChart va boshqalar)
// Avvalgidek qoladi, faqat token tekshiruvi qo'shilgan

async function loadProblemData() {
    try {
        const response = await fetch(PROBLEM_API);
        if (!response.ok) throw new Error("Problem ma'lumotlarini olishda xatolik.");

        const data = await response.json();
        currentProblem = data.id;
        data.functions.forEach(code=>{
            func=code.code;
            console.log(code)
        });
        console.log("data", data.functions)
        const acceptance = Number(data.acceptance.slice(0, 3));
        if (acceptance === 100) {
            document.getElementById("acceptance").innerText = data.acceptance;
        }

        document.title = data.title;
        document.getElementById("problem-title").innerText = data.title;

        if (problemDescription) {
            problemDescription.innerHTML = data.description;
        }

        document.getElementById("problem-constraints").innerHTML = data.constraints;

        const examples = document.getElementById("examples");
        examples.innerHTML = '';
        data.examples.forEach(example => {
            examples.innerHTML += `
                <h1 class="text-red">Kiritish: ${example.input_text}</h1>
                <h1>Natija: ${example.output_text}</h1>
                <h1>Tushuntirish: ${example.explanation}</h1>
                <br>
            `;
        });

        const languageSelect = document.getElementById('language-select');
        languageSelect.innerHTML = '';
        data.function
        data.language.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.id;
            option.textContent = lang.name;
            option.dataset.slug = lang.slug;
            languageSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Xatolik yuz berdi:", error.message);
        const errorContainer = document.getElementById("error-message");
        if (errorContainer) {
            errorContainer.innerText = "Ma'lumotlarni yuklashda xatolik yuz berdi.";
        }
    }
}

function initCodeEditor() {
    editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: 'python',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: false,
        autoCloseBrackets: true,
        matchBrackets: true,
        extraKeys: {
            'Ctrl-Enter': function() {
                if (token) {
                    handleSubmit();
                } else {
                    window.location.href = LOGIN_URL;
                }
            },
            'Cmd-Enter': function() {
                if (token) {
                    handleSubmit();
                } else {
                    window.location.href = LOGIN_URL;
                }
            }
        }
    });
    if (localStorage.getItem(String(currentProblem))){
        editor.setValue(String(func));
    }else if (func!=null){
        editor.setValue(String(func));
    }
    
}

function showConsoleError(message) {
    if (consolePanel) {
        consolePanel.innerText = message;
        consolePanel.style.color = "red";
    }
}

function setupResizeHandler() {
    console.log("Resize handler ishladi");
}

function showConsole() {
    if (consolePanel) {
        consolePanel.style.display = "block";
    }
}

function clearConsole() {
    const consoleContent = document.getElementById('console-content');
    if (consoleContent) {
        consoleContent.innerHTML = '';
    }
}

function addConsoleMessage(message, colorClass = 'text-white') {
    const consoleContent = document.getElementById('console-content');
    if (consoleContent) {
        const div = document.createElement('div');
        div.innerHTML = `<pre class="${colorClass} whitespace-pre-wrap mb-2">${message}</pre>`;
        consoleContent.appendChild(div);

        const newButtons = div.querySelectorAll(".open-modal-btn");
        newButtons.forEach(button => {
            const modalId = button.getAttribute("data-modal-id");
            button.addEventListener("click", () => {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.querySelector('.modal-content').classList.add('opacity-100', 'scale-100');
                    drawIndividualCharts(modalId);
                }
            });
        });

        const closeButtons = div.querySelectorAll(".close-modal-btn");
        closeButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const modal = btn.closest(".modal-wrapper");
                if (modal) {
                    modal.classList.add('hidden');
                    modal.querySelector('.modal-content').classList.remove('opacity-100', 'scale-100');
                }
            });
        });
    }
}

function displayTestResult(result) {
    for (const testName in result) {
        const test = result[testName];
        const passed = test.passed;
        const status = passed ? "✅ Passed" : "❌ Failed";
        
        testResults.push({
            id: testName,
            name: testName,
            time_ms: test.time_ms,
            memory_kb: test.memory_kb,
            status: status,
            input: test.input,
            expected: test.expected,
            actual: test.actual
        });

        const message = `
<button 
    data-modal-id="modal-${testName}" 
    class="open-modal-btn ${test.passed ? "bg-purple-500" : "bg-red-500"} hover:bg-opacity-80 text-white px-3 py-1 text-xs rounded">
    ${testName}
</button>
<div id="modal-${testName}" class="modal-wrapper fixed inset-0 flex items-center justify-center z-50 hidden">
    <div class="modal-backdrop absolute inset-0 bg-black bg-opacity-50" onclick="closeModal('modal-${testName}')"></div>
    <div class="modal-content relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300">
        <div class="flex justify-between items-center p-1 border-b sticky top-0 bg-white z-10">
            <h3 class="text-lg text-zinc-950 font-semibold truncate">Test: ${testName}</h3>
            <button class="close-modal-btn text-gray-500 hover:text-gray-700" onclick="closeModal('modal-${testName}')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="overflow-y-auto p-4 space-y-4">
            <div id="individual-charts-container-${testName}" class="overflow-x-auto flex"></div>
            <div>
            <div class="overflow-hidden">
                <table class="min-w-full">
                    <thead class="border-b">
                        <tr>
                            <th scope="col" class="text-sm font-medium text-gray-900 px-6 py-4 text-left">#</th>
                            <th scope="col" class="text-sm font-medium text-gray-900 px-6 py-4 text-left">Kiritma</th>
                            <th scope="col" class="text-sm font-medium text-gray-900 px-6 py-4 text-left">Natija</th>
                            <th scope="col" class="text-sm font-medium text-gray-900 px-6 py-4 text-left">Vaqt</th>
                            <th scope="col" class="text-sm font-medium text-gray-900 px-6 py-4 text-left">Xotira</th>
                            <th scope="col" class="text-sm font-medium text-gray-900 px-6 py-4 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="border-b">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${testName}</td>
                            <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">${test.input}</td>
                            <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">${test.expected}</td>
                            <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">${test.time_ms.toFixed(2)} MS</td>
                            <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">${test.memory_kb.toFixed(2)} KB</td>
                            <td class="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">${status}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            </div>
        </div>
    </div>
</div>
`.trim();

        const color = passed ? 'text-green-400' : 'text-red-400';
        addConsoleMessage(message, color);
    }

    setupModalListeners();
}

function setupModalListeners() {
    document.querySelectorAll('.open-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modalId;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
                modal.querySelector('.modal-content').classList.add('opacity-100', 'scale-100');
                
                const testName = modalId.replace('modal-', '');
                drawIndividualCharts(testName);
            }
        });
    });

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modal = btn.closest('.modal-wrapper');
            if (modal) {
                modal.classList.add('hidden');
                modal.querySelector('.modal-content').classList.remove('opacity-100', 'scale-100');
            }
        });
    });

    document.querySelectorAll('.modal-backdrop').forEach(bg => {
        bg.addEventListener('click', () => {
            const modal = bg.closest('.modal-wrapper');
            if (modal) {
                modal.classList.add('hidden');
                modal.querySelector('.modal-content').classList.remove('opacity-100', 'scale-100');
            }
        });
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.querySelector('.modal-content').classList.remove('opacity-100', 'scale-100');
    }
}

const resetBtn = document.getElementById('reset-btn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        clearConsole();
        if (editor) {
            editor.setValue('');
        }
    });
}

// Chart JS funksiyalari
const ctx = document.getElementById("resultChart").getContext("2d");
let resultChart = null;

function drawChart() {
    if (resultChart) {
        resultChart.destroy();
    }

    const labels = testResults.map((test, i) => `Test ${i + 1}`);
    const times = testResults.map(test => test.time_ms);
    const memory = testResults.map(test => test.memory_kb);

    const canvas = document.getElementById("resultChart");
    const minWidth = 800;
    const dynamicWidth = labels.length * 50;
    canvas.width = Math.max(dynamicWidth, minWidth);
    canvas.height = 300 + labels.length;

    const ctx = canvas.getContext("2d");

    resultChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '⏱️ Time (ms)',
                    data: times,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                },
                {
                    label: '💾 Memory (KB)',
                    data: memory,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                }
            ]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Test ishlash va xotira sarfi',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        afterBody: function (context) {
                            const index = context[0].dataIndex;
                            return `📌 Status: ${testResults[index].status}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Qiymatlar'
                    }
                }
            }
        }
    });
}

let individualCharts = [];

function drawIndividualCharts(testName) {
    const test = testResults.find(t => t.name === testName);
    if (!test) {
        console.error(`Test topilmadi: ${testName}`);
        return;
    }

    const modalId = `modal-${testName}`;
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal topilmadi: ${modalId}`);
        return;
    }

    const containerId = `individual-charts-container-${testName}`;
    let container = modal.querySelector(`#${containerId}`);
    
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'flex flex-wrap gap-4 p-4';
        
        const modalContent = modal.querySelector('.modal-content .p-4');
        if (modalContent) {
            modalContent.insertBefore(container, modalContent.firstChild);
        } else {
            console.error("Modal content topilmadi");
            return;
        }
    }
    
    container.innerHTML = '';

    const timeCanvas = document.createElement('canvas');
    timeCanvas.width = 300;
    timeCanvas.height = 250;
    timeCanvas.className = 'chart-canvas';
    container.appendChild(timeCanvas);

    const memoryCanvas = document.createElement('canvas');
    memoryCanvas.width = 300;
    memoryCanvas.height = 250;
    memoryCanvas.className = 'chart-canvas';
    container.appendChild(memoryCanvas);

    new Chart(timeCanvas, {
        type: 'bar',
        data: {
            labels: ['Ishlash vaqti'],
            datasets: [{
                label: 'Time (ms)',
                data: [test.time_ms],
                backgroundColor: '#3B82F6',
                borderColor: '#1D4ED8',
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ishlash Vaqti',
                    font: { size: 16 }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Millisekundlar'
                    }
                }
            }
        }
    });

    new Chart(memoryCanvas, {
        type: 'bar',
        data: {
            labels: ['Xotira sarfi'],
            datasets: [{
                label: 'Memory (KB)',
                data: [test.memory_kb],
                backgroundColor: '#10B981',
                borderColor: '#047857',
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Xotira Sarfi',
                    font: { size: 16 }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Kilobaytlar'
                    }
                }
            }
        }
    });

    console.log(`Chartlar muvaffaqiyatli chizildi: ${testName}`);
}

const charts = {
    main: null,
    individuals: []
};

function updateChart() {
    if (charts.main) {
        charts.main.data.labels = testResults.map((_, i) => `Test ${i + 1}`);
        charts.main.data.datasets[0].data = testResults.map(t => t.time_ms);
        charts.main.data.datasets[1].data = testResults.map(t => t.memory_kb);
        charts.main.update();
    } else {
        drawChart();
    }
}