// Configuration
const API_BASE_URL = 'http://localhost:8000'; // Allow easy modification

// --- ROUTER & CORE ---

/**
 * Main function to initialize the app on page load.
 */
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split("/").pop() || 'index.html';
    
    // Always render the header.
    renderHeader();

    // Route to the appropriate page initializer.
    // The index page is public, all others require authentication.
    switch (path) {
        case 'index.html':
            initIndexPage();
            break;
        case 'dashboard.html':
            checkAuth();
            renderNav(path);
            initDashboardPage();
            break;
        case 'hearthealth.html':
            checkAuth();
            renderNav(path);
            initHeartHealthPage();
            break;
        case 'sleephealth.html':
            checkAuth();
            renderNav(path);
            initSleepHealthPage();
            break;
    }
});

/**
 * Navigates to a new page within the app, ensuring correct path resolution.
 * @param {string} page The HTML file to navigate to (e.g., 'dashboard.html').
 */
function navigateTo(page) {
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    window.location.href = basePath + page;
}

/**
 * Checks if user data exists in sessionStorage. If not, redirects to the index page.
 */
function checkAuth() {
    if (!sessionStorage.getItem('uploadData')) {
        navigateTo('index.html');
    }
}

/**
 * Clears session data and redirects to the index page.
 */
function logout() {
    sessionStorage.clear();
    navigateTo('index.html');
}

// --- RENDERERS ---

function renderHeader() {
    const headerContainer = document.getElementById('app-header');
    if (headerContainer) {
        headerContainer.innerHTML = `
            <header class="container text-center pt-4 pb-3">
                <h1 class="h2 fw-bold">OwnMyHealth</h1>
                <p class="lead text-muted">Visualize Your Health Data</p>
            </header>
        `;
    }
}

function renderNav(currentPage) {
    const navContainer = document.getElementById('app-nav');
    if (navContainer) {
        const pages = [
            { name: 'Dashboard', href: 'dashboard.html', icon: 'bi-grid-1x2-fill' },
            { name: 'Heart Health', href: 'hearthealth.html', icon: 'bi-heart-pulse-fill' },
            { name: 'Sleep Health', href: 'sleephealth.html', icon: 'bi-moon-stars-fill' }
        ];

        navContainer.innerHTML = `
            <nav class="container navbar navbar-expand-lg">
                <div class="container-fluid">
                     <ul class="nav nav-pills me-auto mb-2 mb-lg-0">
                        ${pages.map(p => `
                            <li class="nav-item">
                                <a class="nav-link ${currentPage === p.href ? 'active' : ''}" href="${p.href}">
                                    <i class="bi ${p.icon} me-1"></i>${p.name}
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                    <button class="btn btn-outline-danger" onclick="logout()">
                        <i class="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                </div>
            </nav>
            <hr class="container"/>`;
    }
}

function renderMessage(text, type = 'danger') {
    const messageArea = document.getElementById('message-area');
    if (messageArea) {
        messageArea.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
    }
}

// --- PAGE INITIALIZERS ---

function initIndexPage() {
    // If user is already logged in, redirect them to the dashboard.
    if (sessionStorage.getItem('uploadData')) {
        navigateTo('dashboard.html');
        return;
    }
    
    const form = document.getElementById('upload-form');
    if (form) {
        form.addEventListener('submit', handleUpload);
    }
}

function initDashboardPage() {
    const uploadData = JSON.parse(sessionStorage.getItem('uploadData'));
    if (!uploadData) return;

    document.getElementById('file-name').textContent = uploadData.file_name || 'N/A';
    document.getElementById('record-count').textContent = uploadData.record_count || 'N/A';
    document.getElementById('date-range').textContent = uploadData.date_range || 'N/A';
    
    renderRawDataTable(uploadData.records);
}

function initHeartHealthPage() {
    fetchInsights('HeartHealth');
    const uploadData = JSON.parse(sessionStorage.getItem('uploadData'));
    const heartRateData = uploadData.records
        .filter(r => r.type === 'HeartRate' && r.value)
        .map(r => ({ x: new Date(r.date), y: parseInt(r.value, 10) }));
    renderTimeSeriesChart('heartRateChart', 'Heart Rate', heartRateData, 'count/min');
}

function initSleepHealthPage() {
    fetchInsights('SleepHealth');
    const uploadData = JSON.parse(sessionStorage.getItem('uploadData'));
    const sleepData = processSleepData(uploadData.records);
    renderBarChart('sleepChart', 'Sleep Duration', sleepData, 'Hours');
}


// --- API & DATA HANDLING ---

async function handleUpload(event) {
    event.preventDefault();
    const form = event.target;
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const submitBtnText = document.getElementById('upload-btn-text');
    const spinner = document.getElementById('upload-spinner');

    if (!file) {
        renderMessage('Please select a file first.');
        return;
    }
    
    submitBtnText.textContent = 'Uploading...';
    spinner.classList.remove('d-none');
    form.querySelector('button').disabled = true;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'An unknown server error occurred.' }));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        sessionStorage.setItem('uploadData', JSON.stringify(data));
        navigateTo('dashboard.html');

    } catch (error) {
        renderMessage(`Upload failed: ${error.message}`);
    } finally {
        submitBtnText.textContent = 'Upload and Analyze';
        spinner.classList.add('d-none');
        form.querySelector('button').disabled = false;
    }
}

async function fetchInsights(metricType) {
    const insightsContainer = document.getElementById('insights-container');
    const summaryContainer = document.getElementById('insights-summary-container');

    // Set loading state
    insightsContainer.innerHTML = `
        <div class="col-12 text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading Insights...</span>
            </div>
            <p class="mt-2">Analyzing your data...</p>
        </div>`;
    
    try {
        const response = await fetch(`${API_BASE_URL}/metrics/insights?metrics=${metricType}`);
        if (!response.ok) throw new Error('Failed to load insights from the server.');
        
        const result = await response.json();
        renderInsights(result.insights, insightsContainer, summaryContainer);

    } catch (error) {
        insightsContainer.innerHTML = `<div class="col"><div class="alert alert-danger">${error.message}</div></div>`;
        if (summaryContainer) summaryContainer.innerHTML = '';
    }
}


function renderInsights(insights, container, summaryContainer) {
    container.innerHTML = ''; // Clear spinner
    
    if (!insights) {
        container.innerHTML = `<div class="col"><div class="alert alert-warning">No insights could be generated.</div></div>`;
        return;
    }

    // Render Summary Card
    if (insights.summary && summaryContainer) {
        const riskColor = insights.risk_assessment?.risk_color || 'secondary';
        const riskCategory = insights.risk_assessment?.risk_category || 'N/A';
        summaryContainer.innerHTML = `
        <div class="card bg-dark-2 border-secondary mb-4 risk-color-${riskColor}">
            <div class="card-header"><strong>Summary</strong></div>
            <div class="card-body">
                <p class="mb-2"><strong>Fitness Level:</strong> ${insights.summary.current_fitness_level || 'N/A'}</p>
                <p class="mb-2"><strong>Risk Category:</strong> <span class="fw-bold text-${riskColor}">${riskCategory}</span></p>
                <p class="mb-0"><strong>Last Updated:</strong> ${new Date(insights.summary.last_updated).toLocaleDateString()}</p>
            </div>
        </div>`;
    }

    // AI Summary & Explanation
    if (insights.ai_summary) {
        container.innerHTML += createInsightCard('AI Summary', insights.ai_summary.replace(/\n/g, '<br>'), 'bi-robot');
    }
    if (insights.ai_explanation) {
        container.innerHTML += createInsightCard('AI Explanation', insights.ai_explanation, 'bi-lightbulb-fill');
    }
    
    // Recommendations
    if (insights.risk_assessment?.recommendations?.length) {
         container.innerHTML += createListCard('Recommendations', insights.risk_assessment.recommendations, 'bi-check2-circle');
    }
}

function createInsightCard(title, content, icon) {
    return `
    <div class="col-md-6 mb-4">
        <div class="card bg-dark-2 border-secondary h-100">
            <div class="card-header">
                <h5><i class="bi ${icon} me-2 text-primary"></i>${title}</h5>
            </div>
            <div class="card-body">
                <p class="card-text">${content}</p>
            </div>
        </div>
    </div>`;
}

function createListCard(title, items, icon) {
     return `
    <div class="col-md-6 mb-4">
        <div class="card bg-dark-2 border-secondary h-100">
            <div class="card-header">
                <h5><i class="bi ${icon} me-2 text-primary"></i>${title}</h5>
            </div>
            <div class="card-body">
                <ul class="list-group list-group-flush">
                    ${items.map(item => `<li class="list-group-item bg-transparent border-secondary">${item}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>`;
}

function renderRawDataTable(records) {
    const container = document.getElementById('raw-data-table');
    if (!records || records.length === 0) {
        container.innerHTML = '<p class="text-center p-4">No records found in the uploaded file.</p>';
        return;
    }

    const previewRecords = records.slice(0, 50);

    const table = `
        <table class="table table-dark table-striped table-hover">
            <thead>
                <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Value</th>
                    <th scope="col">Date</th>
                </tr>
            </thead>
            <tbody>
                ${previewRecords.map(r => `
                    <tr>
                        <td>${r.type}</td>
                        <td>${r.value || (r.endDate ? 'Duration' : 'N/A')}</td>
                        <td>${new Date(r.date || r.startDate).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${records.length > 50 ? `<p class="text-muted text-center mt-2">Showing the first 50 of ${records.length} total records.</p>`: ''}
    `;
    container.innerHTML = table;
}

// --- CHARTING ---

Chart.defaults.color = '#ccc';
Chart.defaults.borderColor = '#444';

function renderTimeSeriesChart(canvasId, label, data, unit) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 text-muted p-5">No data available to display chart.</div>`;
        return;
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: label,
                data: data,
                borderColor: 'rgba(13, 110, 253, 0.8)',
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'day', tooltipFormat: 'MMM dd, yyyy HH:mm' },
                    grid: { display: false },
                    ticks: { color: '#888' }
                },
                y: {
                    beginAtZero: false,
                    title: { display: true, text: unit, color: '#aaa' },
                    ticks: { color: '#888' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function renderBarChart(canvasId, label, data, unit) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 text-muted p-5">No data available to display chart.</div>`;
        return;
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.x),
            datasets: [{
                label: label,
                data: data.map(d => d.y),
                backgroundColor: 'rgba(13, 110, 253, 0.6)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: unit, color: '#aaa' },
                    ticks: { color: '#888' }
                },
                x: {
                    ticks: { color: '#888' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function processSleepData(records) {
    const sleepRecords = records.filter(r => r.type === 'SleepAnalysis' && r.value === 'asleep');
    const sleepByNight = {};

    sleepRecords.forEach(r => {
        const startDate = new Date(r.startDate);
        const endDate = new Date(r.endDate);
        const duration = (endDate - startDate) / (1000 * 60 * 60); // in hours

        // Attribute sleep to the date the sleep period *started* on.
        // If sleep starts after midnight (e.g., 1 AM), attribute it to the previous calendar day's "night".
        const night = new Date(startDate);
        if (startDate.getHours() < 12) {
           night.setDate(night.getDate() - 1);
        }
        night.setHours(0, 0, 0, 0); 
        const nightKey = night.toISOString().split('T')[0];

        if (!sleepByNight[nightKey]) {
            sleepByNight[nightKey] = 0;
        }
        sleepByNight[nightKey] += duration;
    });

    return Object.entries(sleepByNight)
        .map(([date, hours]) => ({ x: date, y: parseFloat(hours.toFixed(2)) }))
        .sort((a, b) => new Date(a.x) - new Date(b.x))
        .slice(-30); // Show only the last 30 nights for clarity
}