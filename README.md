# OwnMyHealth Web Frontend

This repository contains the frontend code for **OwnMyHealth**, a web application to visualize your Apple Health data. The application is built with plain HTML, Tailwind CSS, and vanilla JavaScript, making it lightweight and easy to deploy.

## Features

-   **Data Upload:** Upload your `export.xml` from Apple Health.
-   **Dashboard:** A central hub to navigate to different health categories.
-   **Heart Health:** Detailed insights, risk assessment, and AI-powered explanations of your heart data.
-   **Sleep Health:** Placeholder for future sleep analysis.
-   **Responsive Design:** Works seamlessly on desktop and mobile devices.

## Local Development

1.  **Clone the repository:**
    ```bash
    git clone git@github.com:wcycmu/ownmyhealth_web.git
    cd ownmyhealth_web
    ```
2.  **Run the backend server:**
    Ensure your backend API server is running, typically on `http://localhost:8000`. The frontend is configured to send requests to this address.

3.  **Serve the frontend:**
    You can use any simple HTTP server to serve the static files. If you have Python installed:
    ```bash
    # For Python 3
    python -m http.server
    ```
    Now, open your web browser and navigate to `http://localhost:8000` (or the port your server is running on).

## Deployment to GitHub Pages

You can easily host this static site for free using GitHub Pages.

### Step-by-Step Instructions

1.  **Clone the Repo:**
    Make sure you have a local copy of the repository.
    ```bash
    git clone git@github.com:wcycmu/ownmyhealth_web.git
    cd ownmyhealth_web
    ```

2.  **Ensure Files are in Root:**
    All the necessary files (`index.html`, `dashboard.html`, `hearthealth.html`, `sleephealth.html`, `style.css`, `script.js`) must be in the root directory of your repository.

3.  **Push to GitHub:**
    Commit and push your latest changes to the `main` branch on GitHub.
    ```bash
    git add .
    git commit -m "Deploy to GitHub Pages"
    git push origin main
    ```

4.  **Enable GitHub Pages:**
    -   In your repository on GitHub, go to the **Settings** tab.
    -   In the left sidebar, click on **Pages**.
    -   Under the "Build and deployment" section, for the **Source**, select **Deploy from a branch**.
    -   Set the branch to **`main`** and the folder to **`/(root)`**.
    -   Click **Save**.

5.  **Visit Your Site:**
    GitHub will publish your site and provide a URL. It might take a few minutes for the site to become available. The URL will look like this:

    `https://<your-username>.github.io/ownmyhealth_web/`

    You can find the exact URL in the **Settings -> Pages** section once it's deployed.

### Important Note on API Backend

This frontend is designed to communicate with a backend API (running at `http://localhost:8000` by default). When deploying to a public URL like GitHub Pages, the browser's security policies will prevent `http://` requests from an `https://` site.

For the deployed version to work, you must:
1.  Host your backend API on a public server with HTTPS enabled.
2.  Update the `API_BASE_URL` constant in `script.js` to point to your new public API URL.
    ```javascript
    // In script.js
    const config = {
        API_BASE_URL: 'https://your-production-api-url.com',
    };
    ```
3.  Push the change to GitHub to redeploy the site with the new configuration.
