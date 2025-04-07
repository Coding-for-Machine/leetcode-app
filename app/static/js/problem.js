        // Global O'zgaruvchilar
        let editor;
        let currentProblem = null;
        let isResizing = false;
        let lastX = 0;
        const API_BASE_URL = "http://127.0.0.1:8000/api";
        
        // Til Shablonlari
        const languageTemplates = {
            python: `def add(a: int, b: int): # kodni yozing
    return a + b`,
            javascript: `function add(a, b) {
    // kodni yozing
    return a + b;
}`,
            java: `public class Solution {
    public int add(int a, int b) {
        // kodni yozing
        return a + b;
    }
}`
        };

        // DOM Yuklanganda
        document.addEventListener('DOMContentLoaded', async function() {
            initCodeEditor();
            await loadProblem();
            setupEventListeners();
            setupResizeHandler();
            checkAuthState();
            loadComments();
        });

        // Kod Tahrirlagichni Boshlash
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
            
            // Boshlang'ich Python shablonini o'rnatish
            editor.setValue(languageTemplates.python);
        }

        // Muammoni Yuklash
        async function loadProblem() {
            try {
                showLoading('Muammo yuklanmoqda...');
                
                // URL'dan slugni olish
                const slug = window.location.pathname.split('/').pop();
                if (!slug) throw new Error("Muammo topilmadi");
                
                const response = await apiRequest(`problems/problem/${slug}`, 'GET');
                if (!response.success) throw new Error(response.error.message);
                
                currentProblem = response.data;
                renderProblem(currentProblem);
                
                // Sahifa sarlavhasini yangilash
                document.title = `${currentProblem.title} - LeetCode Clone`;
            } catch (error) {
                console.error('Muammoni yuklashda xatolik:', error);
                showError('Muammoni yuklab bo\'lmadi. Iltimos, qayta urunib ko\'ring.');
            }
        }

        // Muammoni Ko'rsatish
        function renderProblem(problem) {
            document.getElementById('loading-spinner').classList.add('hidden');
            document.getElementById('problem-content').classList.remove('hidden');
            
            // Muammo sarlavhasi
            document.getElementById('problem-title').textContent = problem.title;
            
            // Qiyinlik darajasi
            const difficultyBadge = document.getElementById('difficulty-badge');
            difficultyBadge.textContent = problem.difficulty;
            difficultyBadge.className = 'px-3 py-1 rounded-full text-sm font-medium ' + 
                                      (problem.difficulty.includes('Oson') ? 'bg-green-100 text-green-800' :
                                       problem.difficulty.includes('O\'rtacha') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800');
            
            // Muammo tavsifi
            document.getElementById('problem-description').innerHTML = problem.description;
            
            // Test holatlari
            const testCasesContainer = document.getElementById('test-cases-container');
            testCasesContainer.innerHTML = '';
            
            if (problem.test_cases && problem.test_cases.length > 0) {
                problem.test_cases.forEach((testCase, index) => {
                    const testCaseElement = document.createElement('div');
                    testCaseElement.className = `test-case p-4 border rounded cursor-pointer ${index === 0 ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`;
                    testCaseElement.innerHTML = `
                        <div class="font-medium mb-2">Test Holati ${index + 1}</div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div class="text-gray-500 mb-1">Kirish</div>
                                <div class="bg-gray-50 p-2 rounded font-mono">${testCase.input_txt || 'N/A'}</div>
                            </div>
                            <div>
                                <div class="text-gray-500 mb-1">Chiqish</div>
                                <div class="bg-gray-50 p-2 rounded font-mono">${testCase.output_txt || 'N/A'}</div>
                            </div>
                        </div>
                    `;
                    testCaseElement.addEventListener('click', () => {
                        document.querySelectorAll('.test-case').forEach(tc => {
                            tc.classList.remove('border-orange-300', 'bg-orange-50');
                            tc.classList.add('border-gray-200');
                        });
                        testCaseElement.classList.add('border-orange-300', 'bg-orange-50');
                        testCaseElement.classList.remove('border-gray-200');
                    });
                    testCasesContainer.appendChild(testCaseElement);
                });
            } else {
                testCasesContainer.innerHTML = '<div class="text-gray-500">Test holatlari mavjud emas</div>';
            }
            
            // Til tanlovini yangilash
            const languageSelect = document.getElementById('language-select');
            languageSelect.innerHTML = '';
            
            if (problem.languages && problem.languages.length > 0) {
                problem.languages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang.slug;
                    option.textContent = lang.name;
                    languageSelect.appendChild(option);
                });
            } else {
                // Agar til berilmagan bo'lsa, standart tillarni qo'shish
                ['python', 'javascript', 'java'].forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang;
                    option.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
                    languageSelect.appendChild(option);
                });
            }
            
            // Agar funksiya shabloni berilgan bo'lsa, uni o'rnatish
            if (problem.functions && problem.functions.length > 0) {
                const defaultFunction = problem.functions.find(f => f.language === 'python') || problem.functions[0];
                editor.setValue(defaultFunction.function || languageTemplates.python);
            }
        }

        // Izohlarni Yuklash
        async function loadComments() {
            try {
                const slug = window.location.pathname.split('/').pop();
                if (!slug) return;
                
                const response = await apiRequest(`comment/${slug}`, 'GET');
                if (!response.success) throw new Error(response.error.message);
                
                renderComments(response.data);
            } catch (error) {
                console.error('Izohlarni yuklashda xatolik:', error);
            }
        }

        // Izohlarni Ko'rsatish
        function renderComments(comments) {
            const container = document.getElementById('comments-container');
            container.innerHTML = '';
            
            if (!comments || comments.length === 0) {
                container.innerHTML = '<div class="text-gray-500">Hozircha izohlar yo\'q</div>';
                return;
            }
            
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment p-4 border rounded bg-gray-50';
                commentElement.innerHTML = `
                    <div class="flex items-start mb-2">
                        <img src="${comment.author.image || '/static/images/default-user.png'}" 
                             alt="${comment.author.username}" 
                             class="w-8 h-8 rounded-full mr-3">
                        <div>
                            <div class="font-medium">${comment.author.username}</div>
                            <div class="text-xs text-gray-500">${new Date(comment.created_at).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="comment-content pl-11">${comment.content}</div>
                `;
                container.appendChild(commentElement);
            });
        }

        // Yangi Izoh Qo'shish
        async function addComment() {
            const commentText = document.getElementById('new-comment').value.trim();
            if (!commentText) {
                showError('Iltimos, izoh matnini kiriting');
                return;
            }
            
            try {
                const slug = window.location.pathname.split('/').pop();
                if (!slug) throw new Error("Muammo topilmadi");
                
                const response = await apiRequest('comment/create', 'POST', {
                    problem_slug: slug,
                    content: commentText
                }, true);
                
                if (!response.success) throw new Error(response.error.message);
                
                // Izohlar ro'yxatini yangilash
                loadComments();
                document.getElementById('new-comment').value = '';
                showSuccess('Izohingiz muvaffaqiyatli qo\'shildi!');
            } catch (error) {
                console.error('Izoh qo\'shishda xatolik:', error);
                showError(error.message || 'Izoh qo\'shib bo\'lmadi');
            }
        }

        // Testlarni Ishlatish
        async function runTests() {
            if (!currentProblem) return;
            
            showConsole();
            clearConsole();
            addConsoleMessage('Testlar ishga tushirilmoqda...', 'text-gray-400');
            
            try {
                const language = document.getElementById('language-select').value;
                const code = editor.getValue();
                
                // Kod sintaksisini tekshirish
                if (!validateCodeSyntax(code, language)) {
                    showError('Kodingizda sintaktik xatolik bor. Iltimos, tuzating.');
                    return;
                }
                
                // Test holatlarini ishga tushirish
                const testResults = [];
                if (currentProblem.test_cases && currentProblem.test_cases.length > 0) {
                    for (const testCase of currentProblem.test_cases) {
                        const result = await executeCodeLocally(code, language, testCase.input_txt, testCase.output_txt);
                        testResults.push(result);
                    }
                } else {
                    addConsoleMessage('Test holatlari mavjud emas. O\'z test holatingizni ishlatishingiz mumkin.', 'text-yellow-600');
                }
                
                if (testResults.length > 0) {
                    displayTestResults(testResults);
                }
            } catch (error) {
                console.error('Testlarni ishga tushirishda xatolik:', error);
                showError(`Xatolik: ${error.message}`);
            }
        }

        // Kod Sintaksisini Tekshirish
        function validateCodeSyntax(code, language) {
            try {
                if (language === 'python') {
                    new Function(code);
                } else if (language === 'javascript') {
                    new Function(code);
                }
                return true;
            } catch (error) {
                addConsoleMessage(`Sintaktik Xato: ${error.message}`, 'text-red-500');
                return false;
            }
        }

        // Kodni Lokal Ishga Tushirish (Simulyatsiya)
        async function executeCodeLocally(code, language, input, expectedOutput) {
            try {
                let output, executionSuccess = false;
                
                if (language === 'python') {
                    // Python kodini ishga tushirish (simulyatsiya)
                    const func = new Function('a', 'b', `${code}\nreturn add(a, b)`);
                    const [a, b] = input.split(' ').map(Number);
                    output = func(a, b).toString();
                    executionSuccess = output === expectedOutput;
                } else {
                    // Boshqa tillar uchun simulyatsiya
                    output = expectedOutput;
                    executionSuccess = Math.random() > 0.3; // 70% ehtimollik bilan to'g'ri
                    addConsoleMessage('Eslatma: Ishga tushirish brauzerda simulyatsiya qilingan', 'text-gray-400');
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
                    output: `Xato: ${error.message}`,
                    expected: expectedOutput,
                    passed: false
                };
            }
        }

        // O'z Test Holatingizni Ishlatish
        async function runCustomTest() {
            const customInput = document.getElementById('custom-input').value.trim();
            if (!customInput) {
                showError('Iltimos, test kiritingizni kiriting');
                return;
            }
            
            showConsole();
            clearConsole();
            addConsoleMessage(`O'z test holatingiz ishga tushirilmoqda: ${customInput}`, 'text-gray-400');
            
            try {
                const language = document.getElementById('language-select').value;
                const code = editor.getValue();
                
                // Kod sintaksisini tekshirish
                if (!validateCodeSyntax(code, language)) {
                    return;
                }
                
                // Testni ishga tushirish
                const result = await executeCodeLocally(code, language, customInput, '');
                
                addConsoleMessage('Test Natijasi:', 'font-bold');
                addConsoleMessage(`Kirish: ${result.input}`, 'text-gray-300');
                addConsoleMessage(`Chiqish: ${result.output}`, result.passed ? 'text-green-500' : 'text-red-500');
                
                if (result.passed) {
                    addConsoleMessage('✓ Test Muvaffaqiyatli O\'tdi', 'text-green-500 font-bold');
                } else {
                    addConsoleMessage('✗ Test Muvaffaqiyatsiz Yakunlandi', 'text-red-500 font-bold');
                }
            } catch (error) {
                console.error('O\'z test holatingizni ishga tushirishda xatolik:', error);
                showError(`Xatolik: ${error.message}`);
            }
        }

        // Yechimni Yuborish
        async function submitSolution() {
            if (!currentProblem) return;
            
            showConsole();
            clearConsole();
            addConsoleMessage('Yechim yuborilmoqda...', 'text-gray-400');
            
            try {
                const language = document.getElementById('language-select').value;
                const code = editor.getValue();
                const customInput = document.getElementById('custom-input').value.trim();
                
                // Kod sintaksisini tekshirish
                if (!validateCodeSyntax(code, language)) {
                    showError('Yuborish uchun kodda sintaktik xatolik bor');
                    return;
                }
                
                // Yuborish uchun ma'lumotlar
                const submissionData = {
                    problem_id: currentProblem.id,
                    language_id: document.getElementById('language-select').selectedOptions[0].value,
                    code: code,
                    custom_inputs: customInput ? [{ input_txt: customInput }] : []
                };
                
                // APIga yuborish
                const response = await apiRequest('solution/create', 'POST', submissionData, true);
                
                if (!response.success) throw new Error(response.error.message);
                
                // Natijani ko'rsatish
                displaySubmissionResult(response.data);
            } catch (error) {
                console.error('Yechimni yuborishda xatolik:', error);
                showError(`Yuborish muvaffaqiyatsiz: ${error.message}`);
            }
        }

        // Yuborish Natijasini Ko'rsatish
        function displaySubmissionResult(result) {
            clearConsole();
            
            if (result.status === 'accepted') {
                addConsoleMessage('✓ Yechimingiz qabul qilindi!', 'text-green-500 font-bold text-lg');
                addConsoleMessage(`Ishlash vaqti: ${result.runtime}`, 'text-gray-300');
                addConsoleMessage(`Xotira: ${result.memory}`, 'text-gray-300');
                
                // Tabriklash animatsiyasi
                const happyEmoji = document.createElement('div');
                happyEmoji.className = 'text-4xl my-4';
                happyEmoji.innerHTML = '🎉';
                document.getElementById('console-content').appendChild(happyEmoji);
            } else {
                addConsoleMessage('✗ Yechimingiz qabul qilinmadi', 'text-red-500 font-bold text-lg');
                
                if (result.error) {
                    addConsoleMessage(`Xato: ${result.error}`, 'text-red-500');
                }
                
                if (result.failed_test_case) {
                    addConsoleMessage('Noto\'g\'ri Test Holati:', 'font-bold mt-4');
                    addConsoleMessage(`Kirish: ${result.failed_test_case.input}`, 'text-gray-300');
                    addConsoleMessage(`Kutilgan Chiqish: ${result.failed_test_case.expected}`, 'text-green-500');
                    addConsoleMessage(`Sizning Chiqishingiz: ${result.failed_test_case.your_output}`, 'text-red-500');
                }
            }
            
            // Yuborishlar tabiga o'tish
            switchTab('submissions');
        }

        // Test Natijalarini Ko'rsatish
        function displayTestResults(results) {
            clearConsole();
            
            let allPassed = true;
            results.forEach((result, index) => {
                const testCaseDiv = document.createElement('div');
                testCaseDiv.className = `mb-4 p-3 rounded ${result.passed ? 'bg-green-50' : 'bg-red-50'}`;
                
                testCaseDiv.innerHTML = `
                    <div class="flex items-center mb-2">
                        <span class="font-medium">Test Holati ${index + 1}</span>
                        <span class="ml-auto ${result.passed ? 'text-green-500' : 'text-red-500'} font-medium">
                            ${result.passed ? '✓ O\'tdi' : '✗ Yiqildi'}
                        </span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div class="text-gray-500 mb-1">Kirish</div>
                            <div class="bg-white p-2 rounded font-mono">${result.input}</div>
                        </div>
                        <div>
                            <div class="text-gray-500 mb-1">Kutilgan Natija</div>
                            <div class="bg-white p-2 rounded font-mono">${result.expected}</div>
                        </div>
                    </div>
                    ${!result.passed ? `
                    <div class="mt-2">
                        <div class="text-gray-500 mb-1">Sizning Natijangiz</div>
                        <div class="bg-white p-2 rounded font-mono text-red-500">${result.output}</div>
                    </div>
                    ` : ''}
                `;
                
                document.getElementById('console-content').appendChild(testCaseDiv);
                
                if (!result.passed) {
                    allPassed = false;
                }
            });
            
            const summaryDiv = document.createElement('div');
            summaryDiv.className = `mt-4 p-3 rounded font-bold ${allPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
            summaryDiv.textContent = allPassed ? 
                `✓ Barcha ${results.length} test holati muvaffaqiyatli o'tdi!` : 
                `✗ ${results.filter(r => !r.passed).length} ta test holati ${results.length} tadan yiqildi`;
            
            document.getElementById('console-content').appendChild(summaryDiv);
            
            // Test natijalari tabiga o'tish
            switchTab('test-results');
        }

        // Kodni Qayta O'rnatish
        function resetCode() {
            if (confirm('Kodingizni boshlang\'ich holatiga qaytarishni istaysizmi?')) {
                const language = document.getElementById('language-select').value;
                editor.setValue(languageTemplates[language] || languageTemplates.python);
                clearConsole();
            }
        }

        // Tablarni Almashish
        function switchTab(tabName) {
            // Barcha tablarni yashirish
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            
            // Tanlangan tabni ko'rsatish
            switch(tabName) {
                case 'editor':
                    document.getElementById('editor-tab').classList.add('active');
                    document.getElementById('console-panel').style.display = 'none';
                    editor.refresh();
                    break;
                    
                case 'test-results':
                    document.getElementById('test-results-tab').classList.add('active');
                    document.getElementById('console-panel').style.display = 'block';
                    break;
                    
                case 'submissions':
                    document.getElementById('submission-tab').classList.add('active');
                    document.getElementById('console-panel').style.display = 'block';
                    clearConsole();
                    addConsoleMessage('Yuborishlar tarixi yuklanmoqda...', 'text-gray-400');
                    // Haqiqiy loyihada bu yerda APIdan yuborishlar tarixi yuklanadi
                    setTimeout(() => {
                        clearConsole();
                        addConsoleMessage('Hozircha yuborishlar mavjud emas. Yechimingizni yuboring!', 'text-gray-400');
                    }, 1000);
                    break;
            }
        }

        // Konsolni Ko'rsatish
        function showConsole() {
            document.getElementById('console-panel').style.display = 'block';
        }

        // Konsolni Tozalash
        function clearConsole() {
            document.getElementById('console-content').innerHTML = '';
        }

        // Konsolga Xabar Qo'shish
        function addConsoleMessage(message, className = '') {
            const messageDiv = document.createElement('div');
            messageDiv.className = className;
            messageDiv.textContent = message;
            document.getElementById('console-content').appendChild(messageDiv);
        }

        // Yuklanmoqda Spinnerini Ko'rsatish
        function showLoading(message) {
            document.getElementById('loading-spinner').classList.remove('hidden');
            document.getElementById('problem-content').classList.add('hidden');
            document.getElementById('problem-title').textContent = message;
        }

        // Xatolikni Ko'rsatish
        function showError(message) {
            clearConsole();
            addConsoleMessage(message, 'text-red-500 font-bold');
            showConsole();
        }

        // Muvaffaqiyatli Xabarni Ko'rsatish
        function showSuccess(message) {
            clearConsole();
            addConsoleMessage(message, 'text-green-500 font-bold');
            showConsole();
        }

        // O'lcham O'zgartirishni Sozlash
        function setupResizeHandler() {
            const resizeHandle = document.querySelector('.resize-handle');
            const problemPanel = document.getElementById('problem-panel');
            
            resizeHandle.addEventListener('mousedown', function(e) {
                isResizing = true;
                lastX = e.clientX;
                document.body.style.cursor = 'col-resize';
                document.addEventListener('mousemove', handleResize);
                document.addEventListener('mouseup', stopResize);
            });
            
            function handleResize(e) {
                if (!isResizing) return;
                const dx = e.clientX - lastX;
                const problemPanelWidth = parseInt(window.getComputedStyle(problemPanel).width);
                const newWidth = problemPanelWidth + dx;
                
                if (newWidth > 300 && newWidth < window.innerWidth - 300) {
                    problemPanel.style.width = `${newWidth}px`;
                    lastX = e.clientX;
                    editor.refresh();
                }
            }
            
            function stopResize() {
                isResizing = false;
                document.body.style.cursor = '';
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', stopResize);
            }
        }

        // API So'rovlari
        async function apiRequest(endpoint, method, data = null, auth = false) {
            const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/${endpoint}`;
            const headers = { "Content-Type": "application/json" };
            
            if (auth) {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    showError('Avtorizatsiya talab qilinadi. Iltimos, tizimga kiring.');
                    return { success: false, error: { message: "Avtorizatsiya talab qilinadi" } };
                }
                headers["Authorization"] = `Bearer ${token}`;
            }

            try {
                const options = {
                    method,
                    headers,
                    body: data ? JSON.stringify(data) : null
                };
                
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    return { 
                        success: false, 
                        error: {
                            status: response.status,
                            data: errorData,
                            message: errorData.detail || errorData.message || `So'rovda xatolik (${response.status})`
                        }
                    };
                }
                
                const responseData = await response.json().catch(() => ({}));
                return { success: true, data: responseData };
                
            } catch (error) {
                console.error(`API Xato [${endpoint}]:`, error);
                return { 
                    success: false, 
                    error: {
                        status: 0,
                        data: null,
                        message: error.message || "Tarmoq xatosi. Iltimos, internet aloqasini tekshiring"
                    }
                };
            }
        }

        // Auth Holatini Tekshirish
        function checkAuthState() {
            const token = localStorage.getItem('access_token');
            const submitCommentBtn = document.getElementById('submit-comment');
            const newCommentField = document.getElementById('new-comment');
            
            if (submitCommentBtn && newCommentField) {
                if (token) {
                    submitCommentBtn.disabled = false;
                    newCommentField.disabled = false;
                    newCommentField.placeholder = "Izohingizni yozing...";
                } else {
                    submitCommentBtn.disabled = true;
                    newCommentField.disabled = true;
                    newCommentField.placeholder = "Izoh qoldirish uchun tizimga kiring...";
                }
            }
        }

        // Event Listenerlarni Sozlash
        function setupEventListeners() {
            // Ishlatish tugmasi
            document.getElementById('run-btn').addEventListener('click', runTests);
            
            // Yuborish tugmasi
            document.getElementById('submit-btn').addEventListener('click', submitSolution);
            
            // O'z test holatini ishga tushirish
            document.getElementById('run-custom-btn').addEventListener('click', runCustomTest);
            
            // Qayta o'rnatish tugmasi
            document.getElementById('reset-btn').addEventListener('click', resetCode);
            
            // Tab almashish
            document.getElementById('editor-tab').addEventListener('click', () => switchTab('editor'));
            document.getElementById('test-results-tab').addEventListener('click', () => switchTab('test-results'));
            document.getElementById('submission-tab').addEventListener('click', () => switchTab('submissions'));
            
            // Til tanlovi o'zgartirilganda
            document.getElementById('language-select').addEventListener('change', function() {
                const language = this.value;
                editor.setValue(languageTemplates[language] || languageTemplates.python);
                
                // Sintaksis ranglari uchun mode ni o'zgartirish
                let mode;
                switch(language) {
                    case 'python': mode = 'python'; break;
                    case 'javascript': mode = 'javascript'; break;
                    case 'java': mode = 'text/x-java'; break;
                    default: mode = 'python';
                }
                editor.setOption('mode', mode);
            });
            
            // Izoh qo'shish tugmasi
            document.getElementById('submit-comment').addEventListener('click', addComment);
        }