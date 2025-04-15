let editor = document.getElementById("code-editor")
const path = window.location.pathname;
const slug = path.split('/').filter(Boolean).pop();
const PROBLEM_API = `http://127.0.0.1:8000/api/problems/${slug}/`;
const SOLUTION_API = 'http://127.0.0.1:8000/api/solution/create/';
let ProblemDescription = document.getElementById("problem-description")
const Conslole = document.getElementById("console-panel")



document.addEventListener("DOMContentLoaded", async () => {
    await ProblemsGet();
    initCodeEditor();
    setupResizeHandler();

})

// get problems data 
async function ProblemsGet(){
    const respone = await fetch(PROBLEM_API)
    if (!respone.ok){
        throw new Error("Problem get Errors?");
    }
    const data = await respone.json()
    console.log(data)
    if (Number(data.acceptance.slice(0, 3))==100){
        document.getElementById("acceptance").innerText=data.acceptance;
    }
    document.title = data.title;
    document.getElementById("problem-title").innerText=data.title;
    const examples=document.getElementById("examples");
    data.examples.forEach(element => {
        examples.innerHTML+=`
        <h1 class="text-red">Kirithish: ${element.input_text}</h1>
        <h1>Natija: ${element.output_text}</h1>
        <h1>Tushintirish: ${element.explanation}</h1>
        <br>
        `
    });
    ProblemDescription.innerHTML=data.description;
    document.getElementById("problem-constraints").innerHTML=data.constraints;
    const languageSelect = document.getElementById('language-select');
    languageSelect.innerHTML = '';
    
    data.language.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.id;
        option.textContent = lang.name;
        option.dataset.slug = lang.slug;
        languageSelect.appendChild(option);
    });
    console.log(data.functions, data.language)
    updateInitialCode(data.functions, data.language[0].id);
}
function updateInitialCode(functions, languageId) {
    // functions.forEach((e)=>{
    //     console.log(e.code)
    // })
    // editor.setValue("nima");
    // const selectedFunction = functions.find(f => f.language_id == languageId);
    // console.log("functions", selectedFunction)
    // if (selectedFunction) {
    //     editor.setValue(selectedFunction.code);
    //     const langSlug = document.querySelector(`#language-select option[value="${languageId}"]`).dataset.slug;
    //     editor.setOption('mode', langSlug);
    // }
}
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
function setupResizeHandler() {
    console.log("hello")
}
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