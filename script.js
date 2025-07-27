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
 * Checks if user data exists or if a new upload just occurred. 
 * If not, redirects to the index page.
 */
function checkAuth() {
    const hasData = sessionStorage.getItem('uploadData');
    const isNew = sessionStorage.getItem('isNewUpload');
    if (!hasData && isNew !== 'true') {
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

function renderDashboardSummary(records) {
    const fileName = sessionStorage.getItem('fileName');
    document.getElementById('file-name').textContent = fileName || 'N/A';

    if (!records || records.length === 0) {
        document.getElementById('record-count').textContent = '0';
        document.getElementById('date-range').textContent = 'N/A';
        return;
    }

    document.getElementById('record-count').textContent = records.length;

    let minDate = null;
    let maxDate = null;

    records.forEach(r => {
        const recordDates = [r.date, r.startDate, r.endDate].filter(Boolean).map(d => new Date(d));
        recordDates.forEach(date => {
            if (!isNaN(date.getTime())) { // Ensure date is valid
                if (minDate === null || date < minDate) {
                    minDate = date;
                }
                if (maxDate === null || date > maxDate) {
                    maxDate = date;
                }
            }
        });
    });

    if (minDate && maxDate) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        document.getElementById('date-range').textContent = 
            `${minDate.toLocaleDateString(undefined, options)} - ${maxDate.toLocaleDateString(undefined, options)}`;
    } else {
        document.getElementById('date-range').textContent = 'No valid dates found';
    }
}

function renderRawDataTable(records) {
    const container = document.getElementById('raw-data-table');
    if (!container) return;

    if (!records || records.length === 0) {
        container.innerHTML = '<p class="text-center p-3">No data to display.</p>';
        return;
    }

    // Take a small sample for preview
    const sample = records.slice(0, 100);
    
    // Dynamically create headers from the first record
    const headers = Object.keys(sample[0]);

    const table = `
        <table class="table table-dark table-striped table-hover">
            <thead>
                <tr>
                    ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${sample.map(row => `
                    <tr>
                        ${headers.map(h => `<td>${row[h] !== null ? row[h] : ''}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${records.length > 100 ? `<p class="text-muted text-center mt-2">Showing first 100 of ${records.length} records.</p>` : ''}
    `;

    container.innerHTML = table;
}

// --- PAGE INITIALIZERS ---

function initIndexPage() {
    if (sessionStorage.getItem('uploadData')) {
        navigateTo('dashboard.html');
        return;
    }

    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const uploadBtnText = document.getElementById('upload-btn-text');
    const uploadSpinner = document.getElementById('upload-spinner');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fileInput.files || fileInput.files.length === 0) {
            renderMessage('Please select a file to upload.', 'warning');
            return;
        }

        uploadBtnText.classList.add('d-none');
        uploadSpinner.classList.remove('d-none');
        form.querySelector('button').disabled = true;
        renderMessage('', 'info'); // Clear previous messages

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || result.status !== 'success') {
                throw new Error(result.message || result.detail || 'File upload failed.');
            }
            
            // On success, don't store data yet. Set a flag to fetch it on the dashboard.
            sessionStorage.setItem('fileName', fileInput.files[0].name);
            sessionStorage.setItem('isNewUpload', 'true');
            sessionStorage.removeItem('uploadData'); // Clear any old data
            
            navigateTo('dashboard.html');

        } catch (error) {
            renderMessage(error.message, 'danger');
        } finally {
            uploadBtnText.classList.remove('d-none');
            uploadSpinner.classList.add('d-none');
            form.querySelector('button').disabled = false;
        }
    });
}

async function initDashboardPage() {
    const isNewUpload = sessionStorage.getItem('isNewUpload');
    let rawData = JSON.parse(sessionStorage.getItem('uploadData'));

    const dataTableContainer = document.getElementById('raw-data-table');
    
    // If data already exists in session, just render it.
    if (rawData) {
        renderDashboardSummary(rawData);
        renderRawDataTable(rawData);
        return;
    }

    // If it's a new upload, fetch data from the server.
    if (isNewUpload === 'true') {
        sessionStorage.removeItem('isNewUpload'); // Remove flag to prevent re-fetching

        try {
            // Assumes a GET /records endpoint exists to fetch data post-upload.
            const response = await fetch(`${API_BASE_URL}/records`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Could not fetch health data.' }));
                throw new Error(errorData.detail);
            }
            
            const fetchedData = await response.json();
            // API could return {records: [...]} or just [...]
            rawData = fetchedData.records || fetchedData;

            if (!Array.isArray(rawData)) {
                throw new Error("Fetched data is not in the expected format (array of records).");
            }

            sessionStorage.setItem('uploadData', JSON.stringify(rawData));
            
            renderDashboardSummary(rawData);
            renderRawDataTable(rawData);

        } catch (error) {
            console.error("Failed to fetch data for dashboard:", error);
            dataTableContainer.innerHTML = `<div class="alert alert-danger mx-3"><strong>Error loading data:</strong> ${error.message}. Please try uploading the file again.</div>`;
            document.getElementById('file-name').textContent = sessionStorage.getItem('fileName') || 'Error';
            document.getElementById('record-count').textContent = 'Error';
            document.getElementById('date-range').textContent = 'Error';
        }
    } else {
        // This case should be handled by checkAuth(), but as a safeguard.
        checkAuth();
    }
}


function initHeartHealthPage() {
    const rawData = JSON.parse(sessionStorage.getItem('uploadData'));
    if (!rawData) return;
    
    renderHeartRateChart(rawData);
    fetchAndRenderInsights('HeartHealth');
}

function initSleepHealthPage() {
    const rawData = JSON.parse(sessionStorage.getItem('uploadData'));
    if (!rawData) return;

    renderSleepChart(rawData);
    fetchAndRenderInsights('SleepHealth');
}


// --- INSIGHTS & CHARTS ---

async function fetchAndRenderInsights(metric) {
    const insightsContainer = document.getElementById('insights-container');
    const summaryContainer = document.getElementById('insights-summary-container');
    if (!insightsContainer || !summaryContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/metrics/insights?metric=${metric}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: `Could not fetch ${metric} insights.` }));
            throw new Error(errorData.detail);
        }
        const data = await response.json();
        
        // Render Summary Card
        const summary = data.insights.summary;
        const risk = data.insights.risk_assessment;
        summaryContainer.innerHTML = `
            <div class="card bg-dark-2 border-secondary risk-color-${risk.risk_color || 'green'}">
                <div class="card-header">At a Glance</div>
                <div class="card-body">
                    <h5 class="card-title">${risk.risk_category}</h5>
                    <p class="card-text">Current Fitness Level: <strong>${summary.current_fitness_level}</strong></p>
                    <p class="text-muted small">Last updated: ${new Date(summary.last_updated).toLocaleDateString()}</p>
                </div>
            </div>
        `;

        // Render Detailed Insights
        insightsContainer.innerHTML = `
            <div class="col-md-6 mb-4">
                <div class="card bg-dark-2 border-secondary h-100">
                    <div class="card-header">AI Explanation</div>
                    <div class="card-body">
                        <p>${data.insights.ai_explanation.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-4">
                <div class="card bg-dark-2 border-secondary h-100">
                    <div class="card-header">Recommendations</div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            ${risk.recommendations.map(rec => `<li><i class="bi bi-check-circle-fill text-success me-2"></i>${rec}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;


    } catch (error) {
        insightsContainer.innerHTML = `<div class="col-12"><div class="alert alert-warning">${error.message}</div></div>`;
        summaryContainer.innerHTML = '';
    }
}


function renderHeartRateChart(records) {
    const ctx = document.getElementById('heartRateChart');
    if (!ctx) return;

    const heartRateData = records
        .filter(r => r.type === 'HeartRate')
        .map(r => ({
            x: new Date(r.date),
            y: r.value
        }))
        .sort((a, b) => a.x - b.x);
    
    if (heartRateData.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center my-auto">No heart rate data available to display.</p>';
        return;
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Heart Rate (bpm)',
                data: heartRateData,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 1,
                pointRadius: 1,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function renderSleepChart(records) {
    const ctx = document.getElementById('sleepChart');
    if (!ctx) return;

    const sleepData = records
        .filter(r => r.type === 'SleepAnalysis' && r.value.includes('Asleep'))
        .map(r => {
            const startDate = new Date(r.startDate);
            const endDate = new Date(r.endDate);
            const durationHours = (endDate - startDate) / (1000 * 60 * 60);
            // Assign sleep to the night it started on
            const sleepDate = new Date(startDate);
            if (sleepDate.getHours() < 12) { // If sleep started after midnight, attribute to previous day
                sleepDate.setDate(sleepDate.getDate() - 1);
            }
            return { date: sleepDate, duration: durationHours };
        });

    if (sleepData.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center my-auto">No sleep data available to display.</p>';
        return;
    }
    
    // Group sleep by day
    const dailySleep = sleepData.reduce((acc, curr) => {
        const dateString = curr.date.toISOString().split('T')[0];
        acc[dateString] = (acc[dateString] || 0) + curr.duration;
        return acc;
    }, {});

    const chartData = Object.keys(dailySleep)
        .map(date => ({
            x: new Date(date),
            y: dailySleep[date]
        }))
        .sort((a, b) => a.x - b.x)
        .slice(-30); // Show last 30 nights

    new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: [{
                label: 'Sleep Duration (hours)',
                data: chartData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'day' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Hours' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}
