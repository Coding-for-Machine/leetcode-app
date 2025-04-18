document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#problemsTableBody");
    const topicFilter = document.getElementById("topicFilter");
    const difficultyFilter = document.getElementById("difficultyFilter");
    const statusFilter = document.getElementById("statusFilter");
    const premiumOnly = document.getElementById("premiumOnly");
    const hasSolution = document.getElementById("hasSolution");
    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    const randomBtn = document.getElementById("randomProblemBtn");

    const API_URL = "/api/problems/";

    function buildQueryParams() {
        const params = new URLSearchParams();
        if (topicFilter.value) params.append("topic", topicFilter.value);
        if (difficultyFilter.value) params.append("difficulty", difficultyFilter.value);
        if (statusFilter.value) params.append("status", statusFilter.value);
        if (premiumOnly.checked) params.append("premium", "true");
        if (hasSolution.checked) params.append("has_solution", "true");
        return params.toString();
    }

    function fetchProblems() {
        const query = buildQueryParams();
        fetch(`${API_URL}?${query}`)
            .then(response => response.json())
            .then(data => renderProblems(data))
            .catch(error => {
                console.error("Xatolik yuz berdi:", error);
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500">Ma'lumotlarni yuklab bo‘lmadi.</td></tr>`;
            });
    }

    function renderProblems(response) {
        const problems = response.items || [];  // <- Shunday olish kerak
    
        tableBody.innerHTML = "";
    
        if (problems.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-slate-500">Mos keluvchi masalalar topilmadi.</td></tr>`;
            return;
        }
    
        problems.forEach(problem => {
            const row = document.createElement("tr");
            row.classList.add("problem-row");
            row.innerHTML = `
                <td class="px-3 py-2 md:px-6 md:py-3 text-sm text-slate-700">${problem.id}</td>
                <td class="px-3 py-2 md:px-6 md:py-3 text-sm text-indigo-600 font-semibold hover:underline">
                    <a href="/problems/${problem.slug}/">${problem.title}</a>
                </td>
                <td class="px-3 py-2 md:px-6 md:py-3 text-sm text-slate-600">${problem.category}</td>
                <td class="px-3 py-2 md:px-6 md:py-3 text-sm">
                    <span class="px-2 py-1 rounded-lg font-medium text-xs ${getDifficultyClass(problem.difficulty)}">
                        ${problem.difficulty}
                    </span>
                </td>
                <td class="px-3 py-2 md:px-6 md:py-3 text-sm text-slate-500">${problem.acceptance}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    

    function getDifficultyClass(level) {
        switch (level.toLowerCase()) {
            case "oson": return "difficulty-easy";
            case "oʻrtacha": return "difficulty-medium";
            case "qiyin": return "difficulty-hard";
            default: return "";
        }
    }

    applyFiltersBtn.addEventListener("click", fetchProblems);

    randomBtn.addEventListener("click", () => {
        fetch(`${API_URL}random/`)
            .then(response => response.json())
            .then(data => {
                window.location.href = `/problems/${data.slug}/`;
            })
            .catch(error => console.error("Tasodifiy masala yuklab bo‘lmadi:", error));
    });

    // Initial load
    fetchProblems();
});
