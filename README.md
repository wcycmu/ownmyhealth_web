# OwnMyHealth Web Frontend

This project is the frontend for **OwnMyHealth**, an application to visualize your Apple Health data.

## Features

-   Upload your `export.xml` from Apple Health.
-   View a dashboard with a summary of your data.
-   Get AI-powered insights into your Heart Health and Sleep Health.
-   Visualize your heart rate and sleep patterns with interactive charts.
-   Responsive design that works on desktop and mobile devices.

## How to Use

1.  Open `index.html` in your web browser.
2.  Click the "Choose File" button and select your Apple Health `export.xml` file.
3.  Click "Upload and Analyze".
4.  You will be redirected to the dashboard, where you can navigate to see detailed health insights.

***

## Deployment on GitHub Pages

Follow these steps to deploy the application to a free GitHub Pages site.

### Prerequisites

-   A GitHub account.
-   Git installed on your local machine.
-   The backend API running and accessible from the internet. **Note:** You will need to update the `API_BASE_URL` in `script.js` to point to your live backend server URL.

### Step-by-Step Instructions

1.  **Clone the repository:**
    If you haven't already, clone the project to your local machine.
    ```bash
    git clone git@github.com:wcycmu/ownmyhealth_web.git
    cd ownmyhealth_web
    ```

2.  **Move Files to Root:**
    Place all the frontend files (`index.html`, `dashboard.html`, `hearthealth.html`, `sleephealth.html`, `style.css`, `script.js`, `README.md`) into the root directory of your repository.

3.  **Update API Base URL (Important!):**
    Open `script.js` and change the `API_BASE_URL` variable from `http://localhost:8000` to your deployed backend's public URL.

    ```javascript
    // script.js
    const API_BASE_URL = 'https://your-backend-api-url.com'; // <-- CHANGE THIS
    ```

4.  **Commit and Push Changes:**
    Add all the files, commit them, and push them to your `main` branch on GitHub.
    ```bash
    git add .
    git commit -m "Deploy frontend to GitHub Pages"
    git push origin main
    ```

5.  **Enable GitHub Pages:**
    -   On your GitHub repository page, go to the **Settings** tab.
    -   In the left sidebar, click on **Pages**.
    -   Under "Build and deployment", for the **Source**, select **Deploy from a branch**.
    -   Set the **Branch** to `main` and the folder to `/ (root)`.
    -   Click **Save**.

6.  **Visit Your Site:**
    GitHub will build your site and provide you with a URL, typically in the format `https://<your-username>.github.io/<your-repo-name>/`. It may take a few minutes for the site to become live.

That's it! Your OwnMyHealth application is now live.
