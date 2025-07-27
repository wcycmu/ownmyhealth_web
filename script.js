const config = {
    API_BASE_URL: 'http://localhost:8000',
};

// --- ROUTING & AUTH ---

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.endsWith('index.html') || path === '/') {
        initUploadPage();
    } else {
        checkAuth();
        renderHeader();
        if (path.endsWith('dashboard.html')) {
            initDashboardPage();
        } else if (path.endsWith('hearthealth.html')) {
            initHeartHealthPage();
        } else if (path.endsWith('sleephealth.html')) {
            // No specific init needed for placeholder
        }
    }
});

function checkAuth() {
    if (!sessionStorage.getItem('isAuthenticated')) {
        window.location.href = 'index.html';
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// --- HEADER RENDERING ---

function renderHeader() {
    const header = document.getElementById('main-header');
    if (!header) return;

    const path = window.location.pathname;

    header.innerHTML = `
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <div>
                <a href="dashboard.html" class="text-xl font-bold text-gray-800">OwnMyHealth</a>
                <p class="text-gray-500 text-sm">Visualize Your Health Data</p>
            </div>
            <nav class="flex items-center space-x-4">
                <a href="hearthealth.html" class="px-3 py-2 rounded-md text-sm font-medium ${path.endsWith('hearthealth.html') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'}">Heart Health</a>
                <a href="sleephealth.html" class="px-3 py-2 rounded-md text-sm font-medium ${path.endsWith('sleephealth.html') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'}">Sleep Health</a>
                <button onclick="logout()" class="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200">Logout</button>
            </nav>
        </div>
    `;
}

// --- PAGE INITIALIZERS ---

function initUploadPage() {
    const form = document.getElementById('upload-form');
    const submitButton = document.getElementById('submit-button');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitButton.disabled = true;
        buttonText.textContent = 'Processing...';
        spinner.classList.remove('hidden');
        errorMessage.textContent = '';

        const formData = new FormData(form);

        try {
            const response = await fetch(`${config.API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred during upload.' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('uploadResult', JSON.stringify(data));
            window.location.href = 'dashboard.html';

        } catch (error) {
            errorMessage.textContent = `Upload Failed: ${error.message}`;
        } finally {
            submitButton.disabled = false;
            buttonText.textContent = 'Upload and Analyze';
            spinner.classList.add('hidden');
        }
    });
}

function initDashboardPage() {
    const uploadMessageEl = document.getElementById('upload-message');
    const uploadResult = JSON.parse(sessionStorage.getItem('uploadResult'));
    
    if (uploadResult && uploadMessageEl) {
        uploadMessageEl.textContent = `${uploadResult.message} Loaded ${uploadResult.records_loaded} records.`;
    }
}

async function initHeartHealthPage() {
    const content = document.getElementById('heart-health-content');
    const loading = document.getElementById('loading-indicator');
    const errorMsg = document.getElementById('error-message');

    try {
        const [insightsData, timeseriesData] = await Promise.all([
            fetch(`${config.API_BASE_URL}/metrics/insights?metrics=HeartHealth`).then(res => res.json()),
            fetch(`${config.API_...
        
        if (insightsData.error || timeseriesData.error) {
            throw new Error(insightsData.error || timeseriesData.error || 'Failed to fetch data.');
        }

        renderHeartHealthData(insightsData.insights);
        renderTimeseriesImage(timeseriesData.image_base64);

        content.classList.remove('hidden');
    } catch (error) {
        errorMsg.classList.remove('hidden');
        document.getElementById('error-text').textContent = `Could not load heart health data. ${error.message}`;
    } finally {
        loading.classList.add('hidden');
    }
}


// --- HEART HEALTH RENDERERS ---

function renderHeartHealthData(insights) {
    // Risk Assessment
    const riskContent = document.getElementById('risk-assessment-content');
    const risk = insights.risk_assessment;
    const riskColor = risk.risk_color === 'green' ? 'green' : (risk.risk_color === 'yellow' ? 'yellow' : 'red');
    riskContent.innerHTML = `
        <div class="text-center">
            <p class="text-5xl font-bold text-${riskColor}-500">${risk.risk_score}</p>
            <p class="text-lg font-semibold text-${riskColor}-600 bg-${riskColor}-100 rounded-full px-4 py-1 inline-block mt-2">${risk.risk_category}</p>
        </div>
        <div class="mt-4">
            <h4 class="font-semibold text-gray-700">Recommendations:</h4>
            <ul class="list-disc list-inside text-gray-600 text-sm mt-2 space-y-1">
                ${risk.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    `;

    // AI Summary
    document.getElementById('ai-summary').innerHTML = `<p>${insights.ai_explanation.replace(/\n/g, '</p><p>')}</p>`;

    // Personalized Insights
    const insightsContainer = document.getElementById('personalized-insights');
    insightsContainer.innerHTML = insights.personalized_insights.insights.map(insight => {
        const iconColor = insight.type === 'positive' ? 'text-green-500' : 'text-yellow-500';
        const bgColor = insight.type === 'positive' ? 'bg-green-50' : 'bg-yellow-50';
        return `
        <div class="flex items-start space-x-4 p-4 ${bgColor} rounded-lg">
            <div>
                <svg class="w-6 h-6 ${iconColor}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
            </div>
            <div>
                <h4 class="font-semibold text-gray-800">${insight.title}</h4>
                <p class="text-gray-600 text-sm">${insight.message}</p>
                <p class="text-gray-500 text-xs mt-1"><em>Recommendation: ${insight.recommendation}</em></p>
            </div>
        </div>
        `;
    }).join('');

    // Summary Content
    const summary = insights.summary;
    document.getElementById('summary-content').innerHTML = `
        <p><strong>Fitness Level:</strong> <span class="font-medium text-blue-600">${summary.current_fitness_level}</span></p>
        <p><strong>Data Completeness:</strong> ${summary.data_completeness}%</p>
        <p><strong>Last Updated:</strong> ${new Date(summary.last_updated).toLocaleString()}</p>
    `;

    // Training Recommendations
    const training = insights.training_recommendations;
    document.getElementById('training-recs-content').innerHTML = `
        <p><strong>Recommendation:</strong> ${training.recommendation}</p>
        <p><strong>Intensity:</strong> ${training.intensity}</p>
        <p><strong>Frequency:</strong> ${training.frequency}</p>
        <p><strong>Duration:</strong> ${training.duration}</p>
        <p><strong>Focus Zones:</strong></p>
        <div class="flex flex-wrap gap-2 mt-1">
            ${training.zones_to_focus.map(zone => `<span class="bg-gray-200 text-gray-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${zone.replace(/_/g, ' ')}</span>`).join('')}
        </div>
    `;
}

function renderTimeseriesImage(base64Image) {
    const img = document.getElementById('timeseries-image');
    if (base64Image) {
        img.src = `data:image/png;base64,${base64Image}`;
    } else {
        img.alt = 'No timeseries image available.';
    }
}
