<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube DL API Status</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-light: #4285f4;
            --primary-dark: #3367d6;
            --bg-light: #f8f9fa;
            --bg-dark: #121212;
            --card-light: #ffffff;
            --card-dark: #1e1e1e;
            --text-light: #333333;
            --text-dark: #f1f1f1;
            --border-light: #e0e0e0;
            --border-dark: #333333;
            --success-light: #4CAF50;
            --success-dark: #388E3C;
            --error-light: #f44336;
            --error-dark: #d32f2f;
        }

        [data-theme="light"] {
            --primary: var(--primary-light);
            --bg: var(--bg-light);
            --card: var(--card-light);
            --text: var(--text-light);
            --border: var(--border-light);
            --success: var(--success-light);
            --error: var(--error-light);
        }

        [data-theme="dark"] {
            --primary: var(--primary-dark);
            --bg: var(--bg-dark);
            --card: var(--card-dark);
            --text: var(--text-dark);
            --border: var(--border-dark);
            --success: var(--success-dark);
            --error: var(--error-dark);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            transition: background-color 0.3s, color 0.3s;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo i {
            color: var(--primary);
            font-size: 2rem;
        }

        .logo h1 {
            font-weight: 600;
        }

        .theme-toggle {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.5rem;
            color: var(--text);
        }

        .status-card {
            background-color: var(--card);
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
            border: 1px solid var(--border);
        }

        .status-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        .status-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: var(--success);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            color: white;
            font-size: 1.5rem;
        }

        .status-title h2 {
            font-weight: 600;
            margin-bottom: 5px;
        }

        .status-title p {
            color: var(--text);
            opacity: 0.8;
        }

        .status-details {
            margin-top: 20px;
        }

        .detail-item {
            display: flex;
            margin-bottom: 15px;
        }

        .detail-icon {
            margin-right: 15px;
            color: var(--primary);
            font-size: 1.2rem;
            width: 24px;
            text-align: center;
        }

        .detail-content h3 {
            font-weight: 500;
            margin-bottom: 5px;
        }

        .detail-content p {
            opacity: 0.8;
        }

        .api-docs {
            background-color: var(--card);
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
            border: 1px solid var(--border);
        }

        .api-docs h2 {
            margin-bottom: 20px;
            font-weight: 600;
        }

        .endpoint {
            background-color: var(--bg);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid var(--border);
        }

        .endpoint-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        .method {
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: 600;
            margin-right: 10px;
            font-size: 0.9rem;
        }

        .get {
            background-color: #e6f7ff;
            color: #1890ff;
        }

        [data-theme="dark"] .get {
            background-color: #111b2c;
            color: #69c0ff;
        }

        .url {
            font-family: monospace;
            word-break: break-all;
        }

        .param {
            margin-top: 10px;
            font-size: 0.9rem;
        }

        .param strong {
            font-weight: 600;
        }

        .test-section {
            background-color: var(--card);
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border);
        }

        .test-section h2 {
            margin-bottom: 20px;
            font-weight: 600;
        }

        .test-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .input-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .input-group label {
            font-weight: 500;
        }

        .input-group input {
            padding: 10px 15px;
            border-radius: 5px;
            border: 1px solid var(--border);
            background-color: var(--bg);
            color: var(--text);
            font-family: inherit;
        }

        .btn {
            padding: 10px 20px;
            border-radius: 5px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: opacity 0.2s;
        }

        .btn:hover {
            opacity: 0.9;
        }

        .btn-primary {
            background-color: var(--primary);
            color: white;
        }

        .btn-success {
            background-color: var(--success);
            color: white;
        }

        .btn-disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .result-container {
            margin-top: 20px;
            display: none;
        }

        .result-card {
            background-color: var(--bg);
            border-radius: 8px;
            padding: 20px;
            border: 1px solid var(--border);
            margin-top: 15px;
        }

        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .result-title {
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .result-icon {
            font-size: 1.2rem;
        }

        .success .result-icon {
            color: var(--success);
        }

        .error .result-icon {
            color: var(--error);
        }

        .download-btn {
            margin-left: auto;
        }

        .video-info {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
        }

        .thumbnail {
            width: 120px;
            height: 90px;
            border-radius: 5px;
            object-fit: cover;
            border: 1px solid var(--border);
        }

        .video-details {
            flex: 1;
        }

        .video-title {
            font-weight: 600;
            margin-bottom: 5px;
        }

        pre {
            background-color: var(--bg);
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: monospace;
            font-size: 0.85rem;
            border: 1px solid var(--border);
        }

        footer {
            text-align: center;
            margin-top: 40px;
            opacity: 0.7;
            font-size: 0.9rem;
        }

        .loading {
            display: none;
            text-align: center;
            margin: 15px 0;
        }

        .loading i {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
            .container {
                padding: 10px;
            }
            
            .status-card, .api-docs, .test-section {
                padding: 20px;
            }
            
            header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }

            .video-info {
                flex-direction: column;
            }

            .thumbnail {
                width: 100%;
                height: auto;
                max-height: 180px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">
                <i class="fab fa-youtube"></i>
                <h1>YouTube DL API</h1>
            </div>
            <button class="theme-toggle" id="themeToggle">
                <i class="fas fa-moon"></i>
            </button>
        </header>

        <div class="status-card">
            <div class="status-header">
                <div class="status-icon">
                    <i class="fas fa-check"></i>
                </div>
                <div class="status-title">
                    <h2>API is Operational</h2>
                    <p>All systems are functioning normally</p>
                </div>
            </div>
            <div class="status-details">
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-server"></i>
                    </div>
                    <div class="detail-content">
                        <h3>Server Status</h3>
                        <p>Running smoothly with 99.9% uptime</p>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <div class="detail-content">
                        <h3>Response Time</h3>
                        <p>Average 200ms response time</p>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-download"></i>
                    </div>
                    <div class="detail-content">
                        <h3>Recent Usage</h3>
                        <p>10,000+ requests processed today</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="api-docs">
            <h2>API Documentation</h2>
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="url">/dl?url={youtube_url}</span>
                </div>
                <div class="param">
                    <strong>Parameters:</strong>
                    <p><code>url</code> - Valid YouTube URL (required)</p>
                </div>
                <div class="param">
                    <strong>Example:</strong>
                    <p><code>https://your-api-domain.com/dl?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ</code></p>
                </div>
            </div>
        </div>

        <div class="test-section">
            <h2>Test the API</h2>
            <div class="test-form">
                <div class="input-group">
                    <label for="youtubeUrl">YouTube URL</label>
                    <input type="text" id="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." value="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
                </div>
                <button id="testApiBtn" class="btn btn-primary">
                    <i class="fas fa-rocket"></i> Test API
                </button>
            </div>

            <div class="loading" id="loadingIndicator">
                <i class="fas fa-spinner"></i> Processing your request...
            </div>

            <div class="result-container" id="resultContainer">
                <div class="result-card" id="resultCard">
                    <div class="result-header">
                        <div class="result-title" id="resultTitle">
                            <i class="fas fa-check-circle result-icon"></i>
                            <span>API Response</span>
                        </div>
                        <button id="downloadBtn" class="btn btn-success download-btn" disabled>
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                    <div class="video-info" id="videoInfo">
                        <img src="" alt="Thumbnail" class="thumbnail" id="videoThumbnail">
                        <div class="video-details">
                            <div class="video-title" id="videoTitle">Video Title</div>
                            <div id="videoUrl"></div>
                        </div>
                    </div>
                    <pre id="jsonResponse"></pre>
                </div>
            </div>
        </div>

        <footer>
            <p>© 2023 YouTube DL API | Created by @nkka404 | Updates: @premium_channel_404</p>
        </footer>
    </div>

    <script>
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;
        
        // Theme management
        const savedTheme = localStorage.getItem('theme') || 
                          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        html.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
        
        function updateThemeIcon(theme) {
            const icon = themeToggle.querySelector('i');
            if (theme === 'dark') {
                icon.classList.replace('fa-moon', 'fa-sun');
            } else {
                icon.classList.replace('fa-sun', 'fa-moon');
            }
        }

        // API Test functionality
        const testApiBtn = document.getElementById('testApiBtn');
        const youtubeUrlInput = document.getElementById('youtubeUrl');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const resultContainer = document.getElementById('resultContainer');
        const resultCard = document.getElementById('resultCard');
        const resultTitle = document.getElementById('resultTitle');
        const videoInfo = document.getElementById('videoInfo');
        const videoThumbnail = document.getElementById('videoThumbnail');
        const videoTitle = document.getElementById('videoTitle');
        const videoUrl = document.getElementById('videoUrl');
        const jsonResponse = document.getElementById('jsonResponse');
        const downloadBtn = document.getElementById('downloadBtn');

        testApiBtn.addEventListener('click', async () => {
            const url = youtubeUrlInput.value.trim();
            
            if (!url) {
                showError('Please enter a YouTube URL');
                return;
            }

            // Show loading indicator
            loadingIndicator.style.display = 'block';
            resultContainer.style.display = 'none';
            testApiBtn.classList.add('btn-disabled');
            testApiBtn.disabled = true;

            try {
                // Call your API endpoint
                const apiUrl = `/dl?url=${encodeURIComponent(url)}`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch video info');
                }

                // Display results
                displayResults(data);
            } catch (error) {
                showError(error.message);
            } finally {
                loadingIndicator.style.display = 'none';
                testApiBtn.classList.remove('btn-disabled');
                testApiBtn.disabled = false;
            }
        });

        function displayResults(data) {
            // Update UI with response data
            resultCard.className = 'result-card success';
            resultTitle.innerHTML = '<i class="fas fa-check-circle result-icon"></i><span>API Response</span>';
            
            // Video info
            if (data.thumbnail) {
                videoThumbnail.src = data.thumbnail;
            } else if (data.thumbnail_url) {
                videoThumbnail.src = data.thumbnail_url;
            }
            
            videoTitle.textContent = data.title || 'No title available';
            
            if (data.url) {
                videoUrl.innerHTML = `<a href="${data.url}" target="_blank">${data.url}</a>`;
                downloadBtn.disabled = false;
                downloadBtn.onclick = () => {
                    window.open(data.url, '_blank');
                };
            } else {
                videoUrl.textContent = 'No download URL available';
                downloadBtn.disabled = true;
            }
            
            // Raw JSON response
            jsonResponse.textContent = JSON.stringify(data, null, 2);
            
            // Show results
            resultContainer.style.display = 'block';
        }

        function showError(message) {
            resultCard.className = 'result-card error';
            resultTitle.innerHTML = '<i class="fas fa-times-circle result-icon"></i><span>Error</span>';
            videoInfo.style.display = 'none';
            jsonResponse.textContent = message;
            downloadBtn.disabled = true;
            resultContainer.style.display = 'block';
        }
    </script>
</body>
</html>
