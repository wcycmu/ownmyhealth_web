


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
    if (!form) return;

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
        const [insightsData, heartRateTimeseriesData, restingHeartRateTimeseriesData] = await Promise.all([
            fetch(`${config.API_BASE_URL}/metrics/insights?metrics=HeartHealth`).then(res => res.json()),
            fetch(`${config.API_BASE_URL}/metrics/timeseries?metric=HeartRate&decompose=false`).then(res => res.json()),
            fetch(`${config.API_BASE_URL}/metrics/timeseries?metric=RestingHeartRate&decompose=false`).then(res => res.json())
        ]);
        
        const error = insightsData.error || heartRateTimeseriesData.error || restingHeartRateTimeseriesData.error;
        if (error) {
            throw new Error(error || 'Failed to fetch data.');
        }

        renderHeartHealthData(insightsData.insights);
        renderTimeseriesImages(heartRateTimeseriesData.image_base64, restingHeartRateTimeseriesData.image_base64);

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
    // Clear existing content
    document.getElementById('risk-assessment-content').innerHTML = '';
    document.getElementById('ai-summary').innerHTML = '';
    document.getElementById('personalized-insights').innerHTML = '';
    document.getElementById('summary-content').innerHTML = '';
    document.getElementById('training-recs-content').innerHTML = '';

    // Helper to create simple "Key: Value" lines
    const createSummaryLine = (label, value) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = `${label}: `;
        p.appendChild(strong);
        p.append(value);
        return p;
    };

    // --- Risk Assessment ---
    const riskContent = document.getElementById('risk-assessment-content');
    const risk = insights.risk_assessment;
    const riskColor = risk.risk_color === 'green' ? 'green' : (risk.risk_color === 'yellow' ? 'yellow' : 'red');
    
    const riskDisplay = document.createElement('div');
    riskDisplay.className = 'text-center';
    const riskScoreP = document.createElement('p');
    riskScoreP.className = `text-5xl font-bold text-${riskColor}-500`;
    riskScoreP.textContent = risk.risk_score;
    const riskCategoryP = document.createElement('p');
    riskCategoryP.className = `text-lg font-semibold text-${riskColor}-600 bg-${riskColor}-100 rounded-full px-4 py-1 inline-block mt-2`;
    riskCategoryP.textContent = risk.risk_category;
    riskDisplay.append(riskScoreP, riskCategoryP);
    
    const recsContainer = document.createElement('div');
    recsContainer.className = 'mt-4';
    const recsHeader = document.createElement('h4');
    recsHeader.className = 'font-semibold text-gray-700';
    recsHeader.textContent = 'Recommendations:';
    const recsList = document.createElement('ul');
    recsList.className = 'list-disc list-inside text-gray-600 text-sm mt-2 space-y-1';
    risk.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recsList.appendChild(li);
    });
    recsContainer.append(recsHeader, recsList);
    riskContent.append(riskDisplay, recsContainer);
    
    // --- AI Summary & Explanation ---
    const aiSummaryContainer = document.getElementById('ai-summary');
    insights.ai_explanation.split('\n').forEach(paragraphText => {
        if (!paragraphText.trim()) return;
        const p = document.createElement('p');
        p.textContent = paragraphText;
        aiSummaryContainer.appendChild(p);
    });

    // --- Personalized Insights ---
    const insightsContainer = document.getElementById('personalized-insights');
    insights.personalized_insights.insights.forEach(insight => {
        const iconColor = insight.type === 'positive' ? 'text-green-500' : 'text-yellow-500';
        const bgColor = insight.type === 'positive' ? 'bg-green-50' : 'bg-yellow-50';
        
        const wrapper = document.createElement('div');
        wrapper.className = `flex items-start space-x-4 p-4 ${bgColor} rounded-lg`;
        wrapper.innerHTML = `
            <div>
                <svg class="w-6 h-6 ${iconColor}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
            </div>
            <div>
                <h4 class="font-semibold text-gray-800">${insight.title}</h4>
                <p class="text-gray-600 text-sm">${insight.message}</p>
                <p class="text-gray-500 text-xs mt-1"><em>Recommendation: ${insight.recommendation}</em></p>
            </div>
        `;
        insightsContainer.appendChild(wrapper);
    });

    // --- Data Summary ---
    const summaryContent = document.getElementById('summary-content');
    const summary = insights.summary;
    const fitnessP = document.createElement('p');
    fitnessP.innerHTML = `<strong>Fitness Level:</strong> <span class="font-medium text-blue-600">${summary.current_fitness_level}</span>`;
    summaryContent.append(
        fitnessP,
        createSummaryLine('Data Completeness', `${summary.data_completeness}%`),
        createSummaryLine('Last Updated', new Date(summary.last_updated).toLocaleString())
    );

    // --- Training Recommendations ---
    const trainingContent = document.getElementById('training-recs-content');
    const training = insights.training_recommendations;
    trainingContent.append(
        createSummaryLine('Recommendation', training.recommendation),
        createSummaryLine('Intensity', training.intensity),
        createSummaryLine('Frequency', training.frequency),
        createSummaryLine('Duration', training.duration)
    );
    const zonesP = document.createElement('p');
    zonesP.innerHTML = '<strong>Focus Zones:</strong>';
    const zonesContainer = document.createElement('div');
    zonesContainer.className = 'flex flex-wrap gap-2 mt-1';
    training.zones_to_focus.forEach(zone => {
        const span = document.createElement('span');
        span.className = 'bg-gray-200 text-gray-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full';
        span.textContent = zone.replace(/_/g, ' ');
        zonesContainer.appendChild(span);
    });
    trainingContent.append(zonesP, zonesContainer);
}


function renderTimeseriesImages(heartRateBase64, restingHeartRateBase64) {
    const hrImg = document.getElementById('heartrate-timeseries-image');
    const restingHrImg = document.getElementById('resting-heartrate-timeseries-image');

    if (hrImg) {
        if (heartRateBase64) {
            hrImg.src = `data:image/png;base64,${heartRateBase64}`;
            hrImg.style.display = 'block';
        } else {
            hrImg.alt = 'No heart rate image available.';
            hrImg.style.display = 'none'; // Hide if no image
        }
    }

    if (restingHrImg) {
        if (restingHeartRateBase64) {
            restingHrImg.src = `data:image/png;base64,${restingHeartRateBase64}`;
            restingHrImg.style.display = 'block';
        } else {
            restingHrImg.alt = 'No resting heart rate image available.';
            restingHrImg.style.display = 'none'; // Hide if no image
        }
    }
}
