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
let isSubmitting = false; // Yuklash holatini kuzatish
const testResults = []; // Test natijalari
const problemDescription = document.getElementById("problem-description");
const consolePanel = document.getElementById("console-panel");
const path = window.location.pathname;
const slug = path.split('/').filter(Boolean).pop();

const PROBLEM_API = `http://127.0.0.1:8000/api/problems/${slug}/`;
const SOLUTION_API = 'http://127.0.0.1:8000/api/solution/create/';

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

        const response = await fetch(SOLUTION_API, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // CSRF himoyasi uchun
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Server xatosi: ${response.status}`);
        }

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
        throw error; // Yuqori darajaga xatoni uzatish
    }
}

// Qolgan funktsiyalar (loadProblemData, initCodeEditor, showConsoleError, displayTestResult, drawChart va boshqalar) 
// avvalgidek qoladi, faqat ular ichida ham event listenerlarni qayta o'rnatish logikasini qo'shing


// Muammo ma'lumotlarini olish
async function loadProblemData() {
    try {
        const response = await fetch(PROBLEM_API);
        if (!response.ok) throw new Error("Problem ma'lumotlarini olishda xatolik.");

        const data = await response.json();
        currentProblem = data.id;

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

function showConsoleError(message) {
    if (consolePanel) {
        consolePanel.innerText = message;
        consolePanel.style.color = "red";
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
            'Ctrl-Enter': SubmitCode,
            'Cmd-Enter': SubmitCode
        }
    });
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

        // YANGI QO‘SHILGAN tugmalar uchun event listener ulash
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

        // Modal yopish tugmalarini ham yangi div ichidan ulaymiz
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
        
        // Natijalarni arrayga qo'shish
        testResults.push({
            id: testName, // id maydonini qo'shamiz
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

    // Modal event listenerlarini sozlash
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
                
                // Test nomini olish (modal- prefixini olib tashlash)
                const testName = modalId.replace('modal-', '');
                
                // Individual chartlarni chizish
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



const resetBtn = document.getElementById('reset-btn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        clearConsole();
        if (editor) {
            editor.setValue('');
        }
    });
}

// chart js

  // 🧾 Grafik uchun data tayyorlash


const ctx = document.getElementById("resultChart").getContext("2d");
let resultChart = null; // Global chart ob'ektini saqlash uchun

function drawChart() {
    // Avvalgi chartni yo'q qilish
    if (resultChart) {
        resultChart.destroy();
    }

    const labels = testResults.map((test, i) => `Test ${i + 1}`);
    const times = testResults.map(test => test.time_ms);
    const memory = testResults.map(test => test.memory_kb);

    const canvas = document.getElementById("resultChart");
    
    // Canvas parametrlarini sozlash
    const minWidth = 800;
    const dynamicWidth = labels.length * 50;
    canvas.width = Math.max(dynamicWidth, minWidth);
    canvas.height = 300 + labels.length;

    const ctx = canvas.getContext("2d");

    // Yangi chart yaratish
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

// Individual chartlar uchun ham xuddi shu yondashuv
let individualCharts = [];

function drawIndividualCharts(testName) {
    // 1. Test natijasini topish
    const test = testResults.find(t => t.name === testName);
    if (!test) {
        console.error(`Test topilmadi: ${testName}`);
        return;
    }

    // 2. Modal containerini topish
    const modalId = `modal-${testName}`;
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal topilmadi: ${modalId}`);
        return;
    }

    // 3. Charts containerini topish yoki yaratish
    const containerId = `individual-charts-container-${testName}`;
    let container = modal.querySelector(`#${containerId}`);
    
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'flex flex-wrap gap-4 p-4';
        
        // Modal contentni topish
        const modalContent = modal.querySelector('.modal-content .p-4');
        if (modalContent) {
            modalContent.insertBefore(container, modalContent.firstChild);
        } else {
            console.error("Modal content topilmadi");
            return;
        }
    }
    
    // Avvalgi chartlarni tozalash
    container.innerHTML = '';

    // 4. Time chart uchun canvas yaratish
    const timeCanvas = document.createElement('canvas');
    timeCanvas.width = 300;
    timeCanvas.height = 250;
    timeCanvas.className = 'chart-canvas';
    container.appendChild(timeCanvas);

    // 5. Memory chart uchun canvas yaratish
    const memoryCanvas = document.createElement('canvas');
    memoryCanvas.width = 300;
    memoryCanvas.height = 250;
    memoryCanvas.className = 'chart-canvas';
    container.appendChild(memoryCanvas);

    // 6. Time chartni chizish
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

    // 7. Memory chartni chizish
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

// Global chart ob'ektlari
const charts = {
    main: null,
    individuals: []
};

// Chartni yangilash funktsiyasi
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


// BtnYuborish.addEventListener("click", SubmitCode);

/*       // Global variables
let editor;
let currentProblem = null;
let isResizing = false;
let lastX = 0;
const path = window.location.pathname;
const slug = path.split('/').filter(Boolean).pop();
const PROBLEM_API = `http://127.0.0.1:8000/api/problems/${slug}/`;
const SOLUTION_API = 'http://127.0.0.1:8000/api/solution/create/';

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    initCodeEditor();
    await loadProblem();
    setupEventListeners();
    setupResizeHandler();
});
// Run test cases by sending to backend
async function runTests() {
    if (!currentProblem) return;
    
    showConsole();
    clearConsole();
    addConsoleMessage('Running test cases...', 'text-gray-400');
    
    try {
        const languageId = document.getElementById('language-select').value;
        const code = editor.getValue();
        
        const response = await fetch(SOLUTION_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                problem_id: currentProblem.id,
                language_id: languageId,
                code: code
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Streaming response ni o'qish
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let resultText = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            resultText += decoder.decode(value);
            // Har bir test natijasini alohida qayta ishlash
            const lines = resultText.split('\n');
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                
                try {
                    const result = JSON.parse(line);
                    displayTestResult(result);
                } catch (e) {
                    console.log('Partial JSON:', line);
                }
            }
        }
        
    } catch (error) {
        console.error('Error running tests:', error);
        showError(`Error executing tests: ${error.message}`);
    }
}

// Display single test result
function displayTestResult(result) {
    for (const [testName, testData] of Object.entries(result)) {
        const statusClass = testData.passed ? 'test-pass' : 'test-fail';
        const statusIcon = testData.passed ? '✓' : '✗';
        
        const message = `
            <div class="mb-4 p-3 border rounded ${statusClass}">
                <div class="font-medium mb-2">
                    ${statusIcon} ${testName}: ${testData.passed ? 'Passed' : 'Failed'}
                    <span class="text-xs text-gray-500 ml-2">
                        (${testData.time_ms} ms, ${testData.memory_kb.toFixed(2)} KB)
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div class="text-gray-500 mb-1">Input</div>
                        <div class="bg-gray-800 p-2 rounded font-mono">${testData.input}</div>
                    </div>
                    <div>
                        <div class="text-gray-500 mb-1">Output</div>
                        <div class="bg-gray-800 p-2 rounded font-mono">${testData.actual}</div>
                    </div>
                </div>
                ${!testData.passed ? `
                <div class="mt-2">
                    <div class="text-gray-500 mb-1">Expected</div>
                    <div class="bg-gray-800 p-2 rounded font-mono">${testData.expected}</div>
                </div>
                ` : ''}
            </div>
        `;
        
        addConsoleMessage(message, '');
    }
}

// Helper function to add message to console
function addConsoleMessage(message, className) {
    const consoleContent = document.getElementById('console-content');
    const messageElement = document.createElement('div');
    if (className) {
        messageElement.className = className;
    }
    messageElement.innerHTML = message;
    consoleContent.appendChild(messageElement);
    consoleContent.scrollTop = consoleContent.scrollHeight;
}
// Initialize CodeMirror editor
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
            'Ctrl-Enter': runTests,
            'Cmd-Enter': runTests
        }
    });
}

// Load problem from API
async function loadProblem() {
    try {
        showLoading('Loading problem...');
        const response = await fetch(PROBLEM_API);
        if (!response.ok) throw new Error('Failed to load problem');
        
        currentProblem = await response.json();
        renderProblem(currentProblem);
    } catch (error) {
        console.error('Error loading problem:', error);
        showError('Failed to load problem. Please try again.');
    }
}

// Render problem data
function renderProblem(problem) {
    document.getElementById('loading-spinner').classList.add('hidden');
    document.getElementById('problem-content').classList.remove('hidden');
    
    document.getElementById('problem-title').textContent = problem.title;
    
    const difficultyBadge = document.getElementById('difficulty-badge');
    difficultyBadge.textContent = problem.difficulty === 'oson' ? 'Easy' :
                                 problem.difficulty === 'qiyin' ? 'Medium' : 'Hard';
    difficultyBadge.className = 'px-3 py-1 rounded-full text-sm font-medium ' + 
                              (problem.difficulty === 'easy' ? 'difficulty-easy' :
                               problem.difficulty === 'medium' ? 'difficulty-medium' : 'difficulty-hard');
    
    document.getElementById('problem-description').innerHTML = problem.description;
    
    const testCasesContainer = document.getElementById('test-cases-container');
    testCasesContainer.innerHTML = '';
    
    problem.test_cases.forEach((testCase, index) => {
        const testCaseElement = document.createElement('div');
        testCaseElement.className = `test-case p-4 border rounded cursor-pointer ${index === 0 ? 'active-test' : ''}`;
        testCaseElement.innerHTML = `
            <div class="font-medium mb-2">Test Case ${index + 1}</div>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-gray-500 mb-1">Input</div>
                    <div class="bg-gray-50 p-2 rounded font-mono">${testCase.input_txt}</div>
                </div>
                <div>
                    <div class="text-gray-500 mb-1">Output</div>
                    <div class="bg-gray-50 p-2 rounded font-mono">${testCase.output_txt}</div>
                </div>
            </div>
        `;
        testCaseElement.addEventListener('click', () => {
            document.querySelectorAll('.test-case').forEach(tc => tc.classList.remove('active-test'));
            testCaseElement.classList.add('active-test');
        });
        testCasesContainer.appendChild(testCaseElement);
    });
    
    // Populate language selector with proper initial code
    const languageSelect = document.getElementById('language-select');
    languageSelect.innerHTML = '';
    
    problem.languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.id;
        option.textContent = lang.name;
        option.dataset.slug = lang.slug;
        languageSelect.appendChild(option);
    });
    
    // Set initial code based on first language
    updateInitialCode(problem.functions, problem.languages[0].id);
}

// Update initial code based on language with proper function templates
function updateInitialCode(functions, languageId) {
    const selectedFunction = functions.find(f => f.language_id == languageId);
    if (selectedFunction) {
        editor.setValue(selectedFunction.function);
        const langSlug = document.querySelector(`#language-select option[value="${languageId}"]`).dataset.slug;
        editor.setOption('mode', langSlug);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Run button - execute test cases locally
    document.getElementById('run-btn').addEventListener('click', runTests);
    
    // Submit button - submit solution to server
    document.getElementById('submit-btn').addEventListener('click', submitSolution);
    
    // Run custom test case locally
    document.getElementById('run-custom-btn').addEventListener('click', runCustomTest);
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', resetCode);
    
    // Tab switching
    document.getElementById('editor-tab').addEventListener('click', () => switchTab('editor'));
    document.getElementById('test-results-tab').addEventListener('click', () => switchTab('test-results'));
    document.getElementById('submission-tab').addEventListener('click', () => switchTab('submissions'));
    
    // Language selector change - update code template
    document.getElementById('language-select').addEventListener('change', function() {
        updateInitialCode(currentProblem.functions, this.value);
    });
}

// Run test cases locally in the browser
async function runTests() {
    if (!currentProblem) return;
    
    showConsole();
    clearConsole();
    addConsoleMessage('Running test cases locally...', 'text-gray-400');
    
    try {
        const languageId = document.getElementById('language-select').value;
        const langSlug = document.querySelector(`#language-select option[value="${languageId}"]`).dataset.slug;
        const code = editor.getValue();
        
        // Validate code syntax first
        if (!validateCodeSyntax(code, langSlug)) {
            showError('Syntax error in your code. Please fix it before running.');
            return;
        }
        
        // Execute test cases locally
        const testResults = [];
        for (const testCase of currentProblem.test_cases) {
            const result = await executeCodeLocally(code, langSlug, testCase.input_txt, testCase.output_txt);
            testResults.push(result);
        }
        
        displayTestResults(testResults);
    } catch (error) {
        console.error('Error running tests:', error);
        showError(`Error executing tests: ${error.message}`);
    }
}

// Validate code syntax before execution
function validateCodeSyntax(code, language) {
    try {
        if (language === 'python') {
            // Simple Python syntax validation
            new Function(code);
        } else if (language === 'go') {
            // Can't validate Go in browser, just return true
            return true;
        }
        return true;
    } catch (error) {
        addConsoleMessage(`Syntax Error: ${error.message}`, 'test-fail');
        return false;
    }
}

// Execute code locally in the browser
async function executeCodeLocally(code, language, input, expectedOutput) {
    try {
        let output, executionSuccess = false;
        
        if (language === 'python') {
            // Execute Python code in browser
            const [a, b] = input.split(' ').map(Number);
            const func = new Function('a', 'b', `${code}\nreturn Add(a, b)`);
            output = func(a, b);
            executionSuccess = output.toString() === expectedOutput;
        } else if (language === 'go') {
            // Can't execute Go in browser, simulate
            const [a, b] = input.split(' ').map(Number);
            output = a + b; // Simple simulation
            executionSuccess = output.toString() === expectedOutput;
            addConsoleMessage('Note: Go code execution simulated in browser', 'text-gray-400');
        }
        
        return {
            input: input,
            output: output,
            expected: expectedOutput,
            passed: executionSuccess
        };
    } catch (error) {
        return {
            input: input,
            output: `Error: ${error.message}`,
            expected: expectedOutput,
            passed: false
        };
    }
}

// Run custom test case locally
async function runCustomTest() {
    const customInput = document.getElementById('custom-input').value.trim();
    if (!customInput) {
        alert('Please enter a custom test case');
        return;
    }
    
    showConsole();
    clearConsole();
    addConsoleMessage(`Running custom test case locally: ${customInput}`, 'text-gray-400');
    
    try {
        const languageId = document.getElementById('language-select').value;
        const langSlug = document.querySelector(`#language-select option[value="${languageId}"]`).dataset.slug;
        const code = editor.getValue();
        
        // Validate code syntax first
        if (!validateCodeSyntax(code, langSlug)) {
            return;
        }
        
        // Execute custom test locally
        const result = await executeCodeLocally(code, langSlug, customInput, '');
        
        addConsoleMessage('Custom Test Result:', 'font-bold');
        addConsoleMessage(`Input: ${result.input}`, 'text-gray-300');
        addConsoleMessage(`Output: ${result.output}`, result.passed ? 'test-pass' : 'test-fail');
    } catch (error) {
        console.error('Error running custom test:', error);
        showError(`Error executing custom test: ${error.message}`);
    }
}

// Submit solution to server after local validation
async function submitSolution() {
    if (!currentProblem) return;
    
    showConsole();
    clearConsole();
    addConsoleMessage('Validating solution before submission...', 'text-gray-400');
    
    try {
        const languageId = document.getElementById('language-select').value;
        const langSlug = document.querySelector(`#language-select option[value="${languageId}"]`).dataset.slug;
        const code = editor.getValue();
        
        // First validate code syntax locally
        if (!validateCodeSyntax(code, langSlug)) {
            showError('Cannot submit - syntax error in your code');
            return;
        }
        
        // Then run tests locally to catch obvious errors
        addConsoleMessage('Running local tests before submission...', 'text-gray-400');
        const localTestResults = [];
        for (const testCase of currentProblem.test_cases) {
            const result = await executeCodeLocally(code, langSlug, testCase.input_txt, testCase.output_txt);
            localTestResults.push(result);
        }
        
        const allPassedLocally = localTestResults.every(r => r.passed);
        if (!allPassedLocally) {
            addConsoleMessage('Local tests failed. Fix errors before submitting.', 'test-fail font-bold');
            displayTestResults(localTestResults);
            return;
        }
        
        // If local tests pass, submit to server
        addConsoleMessage('Local tests passed. Submitting to server...', 'text-gray-400');
        
        const response = await fetch(SOLUTION_API, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                problem_id: currentProblem.id,
                language_id: languageId,
                code: code
            })
        });
        
        if (!response.ok) throw new Error('Submission failed');
        
        const result = await response.json();
        displaySubmissionResult(result);
    } catch (error) {
        console.error('Error submitting solution:', error);
        showError(`Submission failed: ${error.message}`);
    }
}*/